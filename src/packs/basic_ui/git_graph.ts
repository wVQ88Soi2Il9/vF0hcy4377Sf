import type { history_tree, history_node } from '@/API';
import { get_history_tree, jump_to_history, on_history_change, compute_path_to_root, undo, redo } from '@/API';
import { create_floating_panel } from './panel';

export interface git_graph_component
{
    element: HTMLElement;
    refresh: () => void;
}

export interface git_node_layout
{
    node:              history_node;
    row:               number;
    lane:              number;
    is_current:        boolean;
    is_on_active_path: boolean;
}

export interface git_edge_layout
{
    parent_node: history_node;
    child_node:  history_node;
    x1:          number;
    y1:          number;
    x2:          number;
    y2:          number;
    lane:        number;
}

const LANE_COLORS = [
    '#89b4fa', // Blue (Active / Main)
    '#a6e3a1', // Green
    '#fab387', // Peach
    '#cba6f7', // Mauve
    '#f9e2af', // Yellow
    '#f38ba8', // Red
    '#94e2d5', // Teal
    '#89dceb', // Sky
    '#f5c2e7'  // Pink
];

const ROW_HEIGHT = 30;
const LANE_WIDTH = 16;
const PAD_X = 14;

function get_lane_color(lane: number): string
{
    return LANE_COLORS[lane % LANE_COLORS.length];
}

/**
 * Computes topological row positions, branch lane indices, and Bézier connector curves
 * for the Undo Tree to produce a genuine Git Graph layout.
 */
export function compute_git_graph_layout(tree: history_tree): {
    nodes:        git_node_layout[];
    edges:        git_edge_layout[];
    max_lane:     number;
    total_height: number;
}
{
    const root = tree.nodes.get(0);
    if (!root)
    {
        return { nodes: [], edges: [], max_lane: 0, total_height: 0 };
    }

    const active_path_set = new Set(compute_path_to_root(tree, tree.current_uid));
    const layout_nodes: git_node_layout[] = [];
    const layout_map = new Map<number, git_node_layout>();

    let current_row = 0;
    let next_available_lane = 1;

    function traverse(node: history_node, assigned_lane: number): void
    {
        const is_current = node.uid === tree.current_uid;
        const is_on_active_path = active_path_set.has(node.uid);

        const node_layout: git_node_layout = {
            node,
            row: current_row++,
            lane: assigned_lane,
            is_current,
            is_on_active_path
        };

        layout_nodes.push(node_layout);
        layout_map.set(node.uid, node_layout);

        const children = node.children_uids
            .map(uid => tree.nodes.get(uid))
            .filter((c): c is history_node => c !== undefined);

        // Active path child keeps lane and goes first
        children.sort((a, b) =>
        {
            const a_active = active_path_set.has(a.uid) ? 1 : 0;
            const b_active = active_path_set.has(b.uid) ? 1 : 0;
            return b_active - a_active;
        });

        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            const child_lane = (i === 0) ? assigned_lane : next_available_lane++;
            traverse(child, child_lane);
        }
    }

    traverse(root, 0);

    let max_lane = 0;
    for (const n of layout_nodes)
    {
        if (n.lane > max_lane)
        {
            max_lane = n.lane;
        }
    }

    const edges: git_edge_layout[] = [];
    for (const n of layout_nodes)
    {
        if (n.node.parent_uid !== null)
        {
            const parent_layout = layout_map.get(n.node.parent_uid);
            if (parent_layout)
            {
                const x1 = PAD_X + parent_layout.lane * LANE_WIDTH;
                const y1 = parent_layout.row * ROW_HEIGHT + ROW_HEIGHT / 2;
                const x2 = PAD_X + n.lane * LANE_WIDTH;
                const y2 = n.row * ROW_HEIGHT + ROW_HEIGHT / 2;

                edges.push({
                    parent_node: parent_layout.node,
                    child_node:  n.node,
                    x1,
                    y1,
                    x2,
                    y2,
                    lane: n.lane
                });
            }
        }
    }

    return {
        nodes: layout_nodes,
        edges,
        max_lane,
        total_height: layout_nodes.length * ROW_HEIGHT
    };
}

/**
 * Creates the floating Git Graph panel positioned at top-left, rendering SVG branch tracks,
 * commit dots, HEAD indicators, and instant click-to-jump capabilities.
 */
export function create_git_graph_panel(): git_graph_component
{
    const panel = create_floating_panel({
        id:             'git_graph_panel',
        tag:            'aside',
        position_css:   'top: 16px; left: 16px;',
        default_width:  '340px',
        default_height: '340px',
        title:          '🌿 Git Graph',
        collapsible:    true,
        resize: {
            right:      true,
            bottom:     true,
            min_width:  260,
            max_width:  () => Math.min(window.innerWidth * 0.45, window.innerWidth - 32),
            min_height: 160,
            max_height: () => window.innerHeight - 120
        }
    });

    const body_container = panel.content_element;

    // 1. Controls Header
    const header = document.createElement('div');
    header.className = 'basic_ui_git_graph_header';

    const stats_span = document.createElement('span');
    stats_span.textContent = 'History Timeline';

    const buttons_row = document.createElement('div');
    buttons_row.className = 'basic_ui_history_row';

    const undo_btn = document.createElement('button');
    undo_btn.type = 'button';
    undo_btn.className = 'basic_ui_btn';
    undo_btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>';
    undo_btn.title = 'Undo (Revert most recent action)';

    const redo_btn = document.createElement('button');
    redo_btn.type = 'button';
    redo_btn.className = 'basic_ui_btn';
    redo_btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>';
    redo_btn.title = 'Redo (Re-apply undone action)';

    undo_btn.addEventListener('click', () => { undo(); });
    redo_btn.addEventListener('click', () => { redo(); });

    buttons_row.appendChild(undo_btn);
    buttons_row.appendChild(redo_btn);

    header.appendChild(stats_span);
    header.appendChild(buttons_row);

    // 2. Scrollable Body
    const body = document.createElement('div');
    body.className = 'basic_ui_git_graph_body';

    body_container.appendChild(header);
    body_container.appendChild(body);

    function refresh(): void
    {
        body.innerHTML = '';

        const tree = get_history_tree();
        if (!tree)
        {
            body.innerHTML = '<div class="basic_ui_label_sub" style="padding:10px;">History tree not initialized.</div>';
            undo_btn.disabled = true;
            redo_btn.disabled = true;
            return;
        }

        const can_undo = tree.current_uid !== 0;
        const current_node = tree.nodes.get(tree.current_uid);
        const can_redo = current_node ? current_node.children_uids.length > 0 : false;

        undo_btn.disabled = !can_undo;
        redo_btn.disabled = !can_redo;

        const layout = compute_git_graph_layout(tree);
        if (layout.nodes.length === 0)
        {
            body.innerHTML = '<div class="basic_ui_label_sub" style="padding:10px;">No history records.</div>';
            return;
        }

        stats_span.textContent = `Nodes: ${layout.nodes.length} · Branches: ${layout.max_lane + 1}`;

        const svg_width = PAD_X * 2 + (layout.max_lane + 1) * LANE_WIDTH;
        const total_height = Math.max(layout.total_height, 60);

        // 2.1 SVG Layer
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'basic_ui_git_graph_svg');
        svg.setAttribute('width', String(svg_width));
        svg.setAttribute('height', String(total_height));

        // Draw branch edges (lines / curves)
        for (const edge of layout.edges)
        {
            const color = get_lane_color(edge.lane);
            if (edge.x1 === edge.x2)
            {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', String(edge.x1));
                line.setAttribute('y1', String(edge.y1));
                line.setAttribute('x2', String(edge.x2));
                line.setAttribute('y2', String(edge.y2));
                line.setAttribute('stroke', color);
                line.setAttribute('stroke-width', '2');
                line.setAttribute('stroke-linecap', 'round');
                svg.appendChild(line);
            }
            else
            {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const mid_y = (edge.y1 + edge.y2) / 2;
                const d = `M ${edge.x1} ${edge.y1} C ${edge.x1} ${mid_y}, ${edge.x2} ${mid_y}, ${edge.x2} ${edge.y2}`;
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', color);
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-linecap', 'round');
                svg.appendChild(path);
            }
        }

        // Draw commit dots & active head rings
        for (const n of layout.nodes)
        {
            const cx = PAD_X + n.lane * LANE_WIDTH;
            const cy = n.row * ROW_HEIGHT + ROW_HEIGHT / 2;
            const color = get_lane_color(n.lane);

            if (n.is_current)
            {
                const head_ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                head_ring.setAttribute('cx', String(cx));
                head_ring.setAttribute('cy', String(cy));
                head_ring.setAttribute('r', '7');
                head_ring.setAttribute('fill', 'none');
                head_ring.setAttribute('stroke', color);
                head_ring.setAttribute('stroke-width', '2');
                head_ring.setAttribute('opacity', '0.6');
                svg.appendChild(head_ring);

                const head_dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                head_dot.setAttribute('cx', String(cx));
                head_dot.setAttribute('cy', String(cy));
                head_dot.setAttribute('r', '4.5');
                head_dot.setAttribute('fill', color);
                svg.appendChild(head_dot);
            }
            else
            {
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', String(cx));
                dot.setAttribute('cy', String(cy));
                dot.setAttribute('r', '4');
                dot.setAttribute('fill', n.is_on_active_path ? color : '#181825');
                dot.setAttribute('stroke', color);
                dot.setAttribute('stroke-width', '2');
                svg.appendChild(dot);
            }
        }

        body.appendChild(svg);

        // 2.2 Row Items Container
        const rows_container = document.createElement('div');
        rows_container.className = 'basic_ui_git_graph_rows';

        for (const n of layout.nodes)
        {
            const row_el = document.createElement('div');
            row_el.className = 'basic_ui_git_row';
            if (n.is_current)
            {
                row_el.classList.add('is_current');
            }

            row_el.style.height = `${ROW_HEIGHT}px`;
            row_el.style.paddingLeft = `${svg_width + 4}px`;
            row_el.title = `Jump to #${n.node.uid}: ${n.node.command ? n.node.command.label : 'root (initial)'}`;

            const uid_span = document.createElement('span');
            uid_span.className = 'basic_ui_git_uid';
            uid_span.textContent = `#${n.node.uid}`;

            const msg_span = document.createElement('span');
            msg_span.className = 'basic_ui_git_msg';
            msg_span.textContent = n.node.command ? n.node.command.label : 'root (initial)';

            row_el.appendChild(uid_span);
            row_el.appendChild(msg_span);

            if (n.is_current)
            {
                const head_badge = document.createElement('span');
                head_badge.className = 'basic_ui_git_head_badge';
                head_badge.textContent = 'HEAD';
                row_el.appendChild(head_badge);
            }

            row_el.addEventListener('click', () =>
            {
                jump_to_history(n.node.uid);
            });

            rows_container.appendChild(row_el);
        }

        body.appendChild(rows_container);
    }

    on_history_change(() =>
    {
        refresh();
    });

    refresh();

    return {
        element: panel.element,
        refresh
    };
}
