import type { history_tree, history_node } from '@/API';
import {
    get_history_tree,
    jump_to_history,
    on_history_change,
    compute_path_to_root,
    undo,
    redo,
    jump_to_prev_fork,
    jump_to_next_fork,
    jump_to_leaf,
    find_next_fork_node
} from '@/API';
import { basic_ui } from '@/packs/basic_ui';

export interface cad_timeline_component
{
    element: HTMLElement;
    refresh: () => void;
}

export interface cad_node_layout
{
    node:              history_node;
    col:               number;
    lane:              number;
    is_current:        boolean;
    is_on_active_path: boolean;
}

export interface cad_edge_layout
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
    '#89b4fa', // Blue (Main Track)
    '#a6e3a1', // Green
    '#fab387', // Peach
    '#cba6f7', // Mauve
    '#f9e2af', // Yellow
    '#f38ba8', // Red
    '#94e2d5'  // Teal
];

const COL_WIDTH = 44;
const ROW_HEIGHT = 38;
const CARD_WIDTH = 26;
const CARD_HEIGHT = 26;
const PAD_X = 14;
const PAD_Y = 10;

function get_lane_color(lane: number): string
{
    return LANE_COLORS[lane % LANE_COLORS.length];
}

function get_action_icon(label: string): string
{
    if (label.startsWith('create')) return '➕';
    if (label.startsWith('move')) return '🔄';
    if (label.startsWith('select recipe')) return '⚙️';
    if (label.startsWith('delete')) return '🗑️';
    return '🔷';
}

/**
 * Computes horizontal CAD timeline coordinates (column, lane) and Bézier connector curves.
 */
export function compute_cad_timeline_layout(tree: history_tree): {
    nodes:        cad_node_layout[];
    edges:        cad_edge_layout[];
    max_col:      number;
    max_lane:     number;
    total_width:  number;
    total_height: number;
}
{
    const root = tree.nodes.get(0);
    if (!root)
    {
        return { nodes: [], edges: [], max_col: 0, max_lane: 0, total_width: 0, total_height: 0 };
    }

    const active_path_set = new Set(compute_path_to_root(tree, tree.current_uid));
    const layout_nodes: cad_node_layout[] = [];
    const layout_map = new Map<number, cad_node_layout>();

    let next_available_lane = 1;

    function traverse(node: history_node, assigned_col: number, assigned_lane: number): void
    {
        const is_current = node.uid === tree.current_uid;
        const is_on_active_path = active_path_set.has(node.uid);

        const node_layout: cad_node_layout = {
            node,
            col: assigned_col,
            lane: assigned_lane,
            is_current,
            is_on_active_path
        };

        layout_nodes.push(node_layout);
        layout_map.set(node.uid, node_layout);

        const children = node.children_uids
            .map(uid => tree.nodes.get(uid))
            .filter((c): c is history_node => c !== undefined);

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
            const child_col = assigned_col + 1;
            traverse(child, child_col, child_lane);
        }
    }

    traverse(root, 0, 0);

    let max_col = 0;
    let max_lane = 0;
    for (const n of layout_nodes)
    {
        if (n.col > max_col) max_col = n.col;
        if (n.lane > max_lane) max_lane = n.lane;
    }

    const edges: cad_edge_layout[] = [];
    for (const n of layout_nodes)
    {
        if (n.node.parent_uid !== null)
        {
            const parent_layout = layout_map.get(n.node.parent_uid);
            if (parent_layout)
            {
                const x1 = PAD_X + parent_layout.col * COL_WIDTH + CARD_WIDTH;
                const y1 = PAD_Y + parent_layout.lane * ROW_HEIGHT + CARD_HEIGHT / 2;
                const x2 = PAD_X + n.col * COL_WIDTH;
                const y2 = PAD_Y + n.lane * ROW_HEIGHT + CARD_HEIGHT / 2;

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
        max_col,
        max_lane,
        total_width: (max_col + 1) * COL_WIDTH + PAD_X * 2,
        total_height: (max_lane + 1) * ROW_HEIGHT + PAD_Y * 2
    };
}

/**
 * Creates the CAD-style bottom History Timeline panel with media player transport controls.
 */
export function create_cad_timeline(): cad_timeline_component
{
    const panel = basic_ui.create_floating_panel({
        id:          'cad_timeline_panel',
        tag:         'section',
        title:       'History Tree',
        collapsible: false
    });

    const body_container = panel.content_element;
    body_container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;padding:0;';

    // 1. Controls Header Toolbar (Player Transport Controls)
    const toolbar = document.createElement('div');
    toolbar.className = 'basic_ui_cad_toolbar';

    const info_label = document.createElement('span');
    info_label.className = 'basic_ui_cad_info';
    info_label.textContent = 'Timeline';

    const btn_group = document.createElement('div');
    btn_group.className = 'basic_ui_cad_btn_group';

    // 1.1 Jump to Root (|◀◀)
    const btn_first = document.createElement('button');
    btn_first.type = 'button';
    btn_first.className = 'basic_ui_btn';
    btn_first.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="2.5" height="16" rx="1"/><path d="M12.5 12l8.5 6.5V5.5z"/><path d="M5.5 12l8.5 6.5V5.5z"/></svg>';
    btn_first.title = 'Jump to initial state (Root)';

    // 1.2 Jump to Previous Fork (⏪)
    const btn_prev_fork = document.createElement('button');
    btn_prev_fork.type = 'button';
    btn_prev_fork.className = 'basic_ui_btn';
    btn_prev_fork.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 12l9.5 7V5z"/><path d="M2 12l9.5 7V5z"/></svg>';
    btn_prev_fork.title = 'Jump to previous fork / branch point';

    // 1.3 Step Back / Undo (◀)
    const btn_undo = document.createElement('button');
    btn_undo.type = 'button';
    btn_undo.className = 'basic_ui_btn';
    btn_undo.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4.5v15l-13-7.5z"/></svg>';
    btn_undo.title = 'Step back (Undo)';

    // 1.4 Step Forward / Redo (▶)
    const btn_redo = document.createElement('button');
    btn_redo.type = 'button';
    btn_redo.className = 'basic_ui_btn';
    btn_redo.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4.5v15l13-7.5z"/></svg>';
    btn_redo.title = 'Step forward (Redo)';

    // 1.5 Jump to Next Fork (⏩)
    const btn_next_fork = document.createElement('button');
    btn_next_fork.type = 'button';
    btn_next_fork.className = 'basic_ui_btn';
    btn_next_fork.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 12L3.5 5v14z"/><path d="M22 12l-9.5-7v14z"/></svg>';
    btn_next_fork.title = 'Jump to next fork / branch point';

    // 1.6 Jump to Latest / Leaf (▶▶|)
    const btn_leaf = document.createElement('button');
    btn_leaf.type = 'button';
    btn_leaf.className = 'basic_ui_btn';
    btn_leaf.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="18.5" y="4" width="2.5" height="16" rx="1"/><path d="M11.5 12L3 5.5v13z"/><path d="M18.5 12L10 5.5v13z"/></svg>';
    btn_leaf.title = 'Jump to latest step (End of branch)';

    btn_first.addEventListener('click', () => { jump_to_history(0); });
    btn_prev_fork.addEventListener('click', () => { jump_to_prev_fork(); });
    btn_undo.addEventListener('click', () => { undo(); });
    btn_redo.addEventListener('click', () => { redo(); });
    btn_next_fork.addEventListener('click', () => { jump_to_next_fork(); });
    btn_leaf.addEventListener('click', () => { jump_to_leaf(); });

    btn_group.appendChild(btn_first);
    btn_group.appendChild(btn_prev_fork);
    btn_group.appendChild(btn_undo);
    btn_group.appendChild(btn_redo);
    btn_group.appendChild(btn_next_fork);
    btn_group.appendChild(btn_leaf);

    toolbar.appendChild(info_label);
    toolbar.appendChild(btn_group);

    // 2. Horizontally scrollable track viewport
    const viewport = document.createElement('div');
    viewport.className = 'basic_ui_cad_viewport';

    const canvas_container = document.createElement('div');
    canvas_container.className = 'basic_ui_cad_canvas';

    viewport.appendChild(canvas_container);
    body_container.appendChild(toolbar);
    body_container.appendChild(viewport);

    function refresh(): void
    {
        canvas_container.innerHTML = '';

        const tree = get_history_tree();
        if (!tree)
        {
            canvas_container.innerHTML = '<div class="basic_ui_label_sub" style="padding:16px;">History timeline not initialized.</div>';
            btn_first.disabled = true;
            btn_prev_fork.disabled = true;
            btn_undo.disabled = true;
            btn_redo.disabled = true;
            btn_next_fork.disabled = true;
            btn_leaf.disabled = true;
            return;
        }

        const can_undo = tree.current_uid !== 0;
        const current_node = tree.nodes.get(tree.current_uid);
        const can_redo = current_node ? current_node.children_uids.length > 0 : false;
        const has_prev_fork = tree.current_uid !== 0;
        const has_next_fork = find_next_fork_node(tree, tree.current_uid) !== null;

        btn_first.disabled = !can_undo;
        btn_prev_fork.disabled = !has_prev_fork;
        btn_undo.disabled = !can_undo;
        btn_redo.disabled = !can_redo;
        btn_next_fork.disabled = !has_next_fork;
        btn_leaf.disabled = !can_redo;

        const layout = compute_cad_timeline_layout(tree);
        if (layout.nodes.length === 0)
        {
            canvas_container.innerHTML = '<div class="basic_ui_label_sub" style="padding:16px;">No history records.</div>';
            return;
        }

        info_label.textContent = 'Timeline';

        const total_w = Math.max(layout.total_width + 30, viewport.clientWidth);
        const total_h = Math.max(layout.total_height + 16, 54);

        canvas_container.style.width = `${total_w}px`;
        canvas_container.style.height = `${total_h}px`;

        // 2.1 SVG Connection Curves
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'basic_ui_cad_svg');
        svg.setAttribute('width', String(total_w));
        svg.setAttribute('height', String(total_h));

        for (const edge of layout.edges)
        {
            const color = get_lane_color(edge.lane);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const mid_x = (edge.x1 + edge.x2) / 2;
            const d = `M ${edge.x1} ${edge.y1} C ${mid_x} ${edge.y1}, ${mid_x} ${edge.y2}, ${edge.x2} ${edge.y2}`;
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', '2');
            path.setAttribute('stroke-linecap', 'round');
            svg.appendChild(path);
        }

        canvas_container.appendChild(svg);

        // 2.2 Compact Icon-Only CAD Feature Chips
        for (const n of layout.nodes)
        {
            const x = PAD_X + n.col * COL_WIDTH;
            const y = PAD_Y + n.lane * ROW_HEIGHT;
            const color = get_lane_color(n.lane);

            const card = document.createElement('div');
            card.className = 'basic_ui_cad_chip';
            if (n.is_current)
            {
                card.classList.add('is_current');
            }
            if (n.is_on_active_path)
            {
                card.classList.add('is_active_path');
            }

            card.style.left = `${x}px`;
            card.style.top = `${y}px`;
            card.style.width = `${CARD_WIDTH}px`;
            card.style.height = `${CARD_HEIGHT}px`;
            card.style.borderColor = n.is_current ? color : n.is_on_active_path ? 'var(--basic-ui-surface2)' : 'var(--basic-ui-surface1)';

            const label_str = n.node.command ? n.node.command.label : 'root (initial)';
            const icon = get_action_icon(label_str);

            // Hover displays detailed action summary
            card.title = `${label_str} (Click to jump)`;

            const icon_span = document.createElement('span');
            icon_span.className = 'basic_ui_cad_chip_icon';
            icon_span.textContent = icon;

            card.appendChild(icon_span);

            if (n.is_current)
            {
                const dot = document.createElement('span');
                dot.className = 'basic_ui_cad_chip_dot';
                dot.textContent = '●';
                dot.style.color = color;
                card.appendChild(dot);
            }

            card.addEventListener('click', () =>
            {
                jump_to_history(n.node.uid);
            });

            canvas_container.appendChild(card);

            // Auto-scroll into view if current
            if (n.is_current)
            {
                setTimeout(() =>
                {
                    const target_scroll = Math.max(0, x - viewport.clientWidth / 2 + CARD_WIDTH / 2);
                    viewport.scrollTo({ left: target_scroll, behavior: 'smooth' });
                }, 50);
            }
        }
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
