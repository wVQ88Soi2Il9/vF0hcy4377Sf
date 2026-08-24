import type { history_tree, history_node } from '@/API';
import
{
    get_history_tree,
    jump_to_history,
    on_history_change,
    compute_path_to_root,
    undo,
    redo,
    jump_to_prev_fork,
    jump_to_next_fork,
    jump_to_leaf,
    delete_node,
    find_next_fork_node
} from '@/API';
import { basic_ui } from '@/packs/basic_ui';
import
{
    delete_branch,
    is_node_pinned,
    toggle_node_pin
} from '@/packs/vanilla';

const HIGHLIGHT_COLOR = '#f9e2af';

export interface history_tree_component
{
    element:       HTMLElement;
    refresh:       () => void;
    is_collapsed:  () => boolean;
    set_collapsed: (collapsed: boolean) => void;
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
    parent_uid: number;
    child_uid:  number;
    x1:         number;
    y1:         number;
    x2:         number;
    y2:         number;
    lane:       number;
}

// Git Graph branch colors (Blue main trunk, Pink branch, Green, Peach, Mauve...)
const LANE_COLORS = [
    '#388bfd', // Blue (Main Trunk - Git standard)
    '#f778ba', // Pink / Magenta (Branch 1 - like Git Graph screenshot)
    '#7ee787', // Green (Branch 2)
    '#ffa657', // Peach / Orange (Branch 3)
    '#d2a8ff', // Purple / Mauve (Branch 4)
    '#e3b341', // Yellow (Branch 5)
    '#56d4dd', // Cyan / Teal (Branch 6)
    '#ff7b72'  // Coral (Branch 7)
];

const ROW_HEIGHT = 46;
const LANE_WIDTH = 22;
const PAD_X = 20;
const PAD_Y = 12;
const NODE_RADIUS = 5.5;

function get_lane_color(lane: number): string
{
    return LANE_COLORS[lane % LANE_COLORS.length];
}

function parse_command_details(label: string): {
    icon:        string;
    action_type: string;
    target:      string;
    params:      string;
}
{
    if (!label || label === 'root' || label.startsWith('root'))
    {
        return {
            icon:        '🔷',
            action_type: 'root',
            target:      label || 'root (initial state)',
            params:      ''
        };
    }

    if (label.startsWith('create'))
    {
        return {
            icon:        '➕',
            action_type: 'create',
            target:      label,
            params:      ''
        };
    }

    if (label.startsWith('move'))
    {
        return {
            icon:        '🔄',
            action_type: 'move',
            target:      label,
            params:      ''
        };
    }

    if (label.startsWith('select recipe'))
    {
        return {
            icon:        '⚙️',
            action_type: 'recipe',
            target:      label,
            params:      ''
        };
    }

    if (label.startsWith('delete'))
    {
        return {
            icon:        '🗑️',
            action_type: 'delete',
            target:      label,
            params:      ''
        };
    }

    return {
        icon:        '🔹',
        action_type: 'command',
        target:      label,
        params:      ''
    };
}

/**
 * Computes standard Git Graph topology layout (ordered by UID creation sequence).
 * Each node sits at its creation row, while branches curve out smoothly with Bézier elbows.
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

    // Sort all nodes chronologically by UID (Topological order)
    const sorted_nodes = Array.from(tree.nodes.values()).sort((a, b) => a.uid - b.uid);

    const node_lanes = new Map<number, number>();
    node_lanes.set(0, 0);

    let next_free_lane = 1;

    // Allocate lanes along branch chains
    for (const node of sorted_nodes)
    {
        const current_lane = node_lanes.get(node.uid) ?? 0;
        const children = node.children_uids
            .map(id => tree.nodes.get(id))
            .filter((c): c is history_node => c !== undefined);

        // Sort children: active branch child first, then latest created
        children.sort((a, b) =>
        {
            const a_active = active_path_set.has(a.uid) ? 1 : 0;
            const b_active = active_path_set.has(b.uid) ? 1 : 0;
            if (a_active !== b_active)
            {
                return b_active - a_active;
            }
            return a.uid - b.uid;
        });

        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            if (!node_lanes.has(child.uid))
            {
                if (i === 0)
                {
                    // Primary child inherits parent lane
                    node_lanes.set(child.uid, current_lane);
                }
                else
                {
                    // Forking branch gets a new lane
                    const branch_lane = next_free_lane++;
                    node_lanes.set(child.uid, branch_lane);

                    // Propagate this branch lane down the primary chain of the new branch
                    let curr_branch = child;
                    while (curr_branch)
                    {
                        node_lanes.set(curr_branch.uid, branch_lane);
                        if (curr_branch.children_uids.length === 0)
                        {
                            break;
                        }
                        const next_child = tree.nodes.get(curr_branch.children_uids[0]);
                        if (!next_child || node_lanes.has(next_child.uid))
                        {
                            break;
                        }
                        curr_branch = next_child;
                    }
                }
            }
        }
    }

    const layout_nodes: git_node_layout[] = [];
    const node_coords = new Map<number, { row: number; lane: number }>();

    // Assign rows: Newest nodes at Top (row 0), Root at Bottom (row N - 1)
    for (let i = 0; i < sorted_nodes.length; i++)
    {
        const node = sorted_nodes[i];
        const row = sorted_nodes.length - 1 - i;
        const lane = node_lanes.get(node.uid) ?? 0;
        const is_current = node.uid === tree.current_uid;
        const is_on_active_path = active_path_set.has(node.uid);

        layout_nodes.push({
            node,
            row,
            lane,
            is_current,
            is_on_active_path
        });

        node_coords.set(node.uid, { row, lane });
    }

    // Sort layout nodes by visual row (0 to N - 1) for DOM order
    layout_nodes.sort((a, b) => a.row - b.row);

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
            const parent_pos = node_coords.get(n.node.parent_uid);
            if (parent_pos)
            {
                const x1 = PAD_X + parent_pos.lane * LANE_WIDTH;
                const y1 = PAD_Y + parent_pos.row * ROW_HEIGHT + ROW_HEIGHT / 2;
                const x2 = PAD_X + n.lane * LANE_WIDTH;
                const y2 = PAD_Y + n.row * ROW_HEIGHT + ROW_HEIGHT / 2;

                edges.push({
                    parent_uid: n.node.parent_uid,
                    child_uid:  n.node.uid,
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
        nodes:        layout_nodes,
        edges,
        max_lane,
        total_height: layout_nodes.length * ROW_HEIGHT + PAD_Y * 2
    };
}

/**
 * Creates the vertical Git Graph History Tree panel.
 */
export function create_history_tree(on_collapse_change?: (collapsed: boolean) => void): history_tree_component
{
    const panel = basic_ui.create_floating_panel({
        id:          'history_tree_panel',
        tag:         'aside',
        title:       'History Tree',
        collapsible: false
    });

    const root_element = panel.element;
    root_element.classList.add('history_tree_panel_root');
    root_element.classList.add('is_sidebar_collapsed');

    // Mini Collapsed Strip (Shown when collapsed)
    const collapsed_strip = document.createElement('div');
    collapsed_strip.className = 'history_collapsed_strip';

    // Tree Icon Expand Button (🌳 History Tree)
    const expand_btn = document.createElement('button');
    expand_btn.type = 'button';
    expand_btn.className = 'history_expand_btn';
    expand_btn.title = 'Expand History Tree';
    expand_btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13.5V9.75a3.75 3.75 0 0 0-3.75-3.75H12V3.75a.75.75 0 0 0-1.5 0V6H7.75A3.75 3.75 0 0 0 4 9.75v3.75a2.25 2.25 0 1 0 1.5 0V9.75c0-1.243 1.007-2.25 2.25-2.25H10.5V18a2.25 2.25 0 1 0 1.5 0V7.5h2.75c1.243 0 2.25 1.007 2.25 2.25v3.75a2.25 2.25 0 1 0 2 0z"/></svg>';

    // 6 Vertical Jump / Transport Buttons
    const strip_btn_group = document.createElement('div');
    strip_btn_group.className = 'history_strip_btn_group';

    // 1. Root (|◀◀)
    const strip_btn_first = document.createElement('button');
    strip_btn_first.type = 'button';
    strip_btn_first.className = 'history_strip_btn';
    strip_btn_first.title = 'Jump to Root';
    strip_btn_first.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><rect x="3" y="4" width="2.5" height="16" rx="1"/><path d="M12.5 12l8.5 6.5V5.5z"/><path d="M5.5 12l8.5 6.5V5.5z"/></svg>';

    // 2. Prev Fork (⏪)
    const strip_btn_prev_fork = document.createElement('button');
    strip_btn_prev_fork.type = 'button';
    strip_btn_prev_fork.className = 'history_strip_btn';
    strip_btn_prev_fork.title = 'Jump to Prev Fork';
    strip_btn_prev_fork.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M11 12l9.5 7V5z"/><path d="M2 12l9.5 7V5z"/></svg>';

    // 3. Undo (◀)
    const strip_btn_undo = document.createElement('button');
    strip_btn_undo.type = 'button';
    strip_btn_undo.className = 'history_strip_btn';
    strip_btn_undo.title = 'Undo (Ctrl+Z)';
    strip_btn_undo.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18 4.5v15l-13-7.5z"/></svg>';

    // 4. Redo (▶)
    const strip_btn_redo = document.createElement('button');
    strip_btn_redo.type = 'button';
    strip_btn_redo.className = 'history_strip_btn';
    strip_btn_redo.title = 'Redo (Ctrl+Y)';
    strip_btn_redo.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6 4.5v15l13-7.5z"/></svg>';

    // 5. Next Fork (⏩)
    const strip_btn_next_fork = document.createElement('button');
    strip_btn_next_fork.type = 'button';
    strip_btn_next_fork.className = 'history_strip_btn';
    strip_btn_next_fork.title = 'Jump to Next Fork';
    strip_btn_next_fork.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M13 12L3.5 5v14z"/><path d="M22 12l-9.5-7v14z"/></svg>';

    // 6. Leaf (▶▶|)
    const strip_btn_leaf = document.createElement('button');
    strip_btn_leaf.type = 'button';
    strip_btn_leaf.className = 'history_strip_btn';
    strip_btn_leaf.title = 'Jump to Leaf (Branch End)';
    strip_btn_leaf.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><rect x="18.5" y="4" width="2.5" height="16" rx="1"/><path d="M11.5 12L3 5.5v13z"/><path d="M18.5 12L10 5.5v13z"/></svg>';

    strip_btn_first.addEventListener('click', (e) => { e.stopPropagation(); jump_to_history(0); });
    strip_btn_prev_fork.addEventListener('click', (e) => { e.stopPropagation(); jump_to_prev_fork(); });
    strip_btn_undo.addEventListener('click', (e) => { e.stopPropagation(); undo(); });
    strip_btn_redo.addEventListener('click', (e) => { e.stopPropagation(); redo(); });
    strip_btn_next_fork.addEventListener('click', (e) => { e.stopPropagation(); jump_to_next_fork(); });
    strip_btn_leaf.addEventListener('click', (e) => { e.stopPropagation(); jump_to_leaf(); });

    strip_btn_group.appendChild(strip_btn_first);
    strip_btn_group.appendChild(strip_btn_prev_fork);
    strip_btn_group.appendChild(strip_btn_undo);
    strip_btn_group.appendChild(strip_btn_redo);
    strip_btn_group.appendChild(strip_btn_next_fork);
    strip_btn_group.appendChild(strip_btn_leaf);

    const strip_step_badge = document.createElement('span');
    strip_step_badge.className = 'history_strip_badge';
    strip_step_badge.textContent = '#0';

    expand_btn.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        set_collapsed(false);
    });

    collapsed_strip.appendChild(expand_btn);
    collapsed_strip.appendChild(strip_btn_group);
    collapsed_strip.appendChild(strip_step_badge);

    root_element.appendChild(collapsed_strip);

    // Full Expanded Content
    const expanded_wrapper = document.createElement('div');
    expanded_wrapper.className = 'history_expanded_wrapper';

    // Panel Header Collapse Button (◀)
    const header_collapse_btn = document.createElement('button');
    header_collapse_btn.type = 'button';
    header_collapse_btn.className = 'history_header_collapse_btn';
    header_collapse_btn.title = 'Collapse History Tree';
    header_collapse_btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
    header_collapse_btn.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        set_collapsed(true);
    });

    panel.header_element.appendChild(header_collapse_btn);

    // Controls Header Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'basic_ui_cad_toolbar history_git_toolbar';

    const info_label = document.createElement('span');
    info_label.className = 'basic_ui_cad_info';
    info_label.textContent = 'Git Graph';

    const btn_group = document.createElement('div');
    btn_group.className = 'basic_ui_cad_btn_group';

    // 1. Jump to Root (|◀◀)
    const btn_first = document.createElement('button');
    btn_first.type = 'button';
    btn_first.className = 'basic_ui_btn';
    btn_first.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><rect x="3" y="4" width="2.5" height="16" rx="1"/><path d="M12.5 12l8.5 6.5V5.5z"/><path d="M5.5 12l8.5 6.5V5.5z"/></svg>';
    btn_first.title = 'Jump to initial state (Root)';

    // 2. Jump to Previous Fork (⏪)
    const btn_prev_fork = document.createElement('button');
    btn_prev_fork.type = 'button';
    btn_prev_fork.className = 'basic_ui_btn';
    btn_prev_fork.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M11 12l9.5 7V5z"/><path d="M2 12l9.5 7V5z"/></svg>';
    btn_prev_fork.title = 'Jump to previous fork';

    // 3. Step Back / Undo (◀)
    const btn_undo = document.createElement('button');
    btn_undo.type = 'button';
    btn_undo.className = 'basic_ui_btn';
    btn_undo.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M18 4.5v15l-13-7.5z"/></svg>';
    btn_undo.title = 'Step back (Undo)';

    // 4. Step Forward / Redo (▶)
    const btn_redo = document.createElement('button');
    btn_redo.type = 'button';
    btn_redo.className = 'basic_ui_btn';
    btn_redo.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M6 4.5v15l13-7.5z"/></svg>';
    btn_redo.title = 'Step forward (Redo)';

    // 5. Jump to Next Fork (⏩)
    const btn_next_fork = document.createElement('button');
    btn_next_fork.type = 'button';
    btn_next_fork.className = 'basic_ui_btn';
    btn_next_fork.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M13 12L3.5 5v14z"/><path d="M22 12l-9.5-7v14z"/></svg>';
    btn_next_fork.title = 'Jump to next fork';

    // 6. Jump to Latest / Leaf (▶▶|)
    const btn_leaf = document.createElement('button');
    btn_leaf.type = 'button';
    btn_leaf.className = 'basic_ui_btn';
    btn_leaf.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><rect x="18.5" y="4" width="2.5" height="16" rx="1"/><path d="M11.5 12L3 5.5v13z"/><path d="M18.5 12L10 5.5v13z"/></svg>';
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

    // Scrollable Vertical Git Graph Viewport
    const viewport = document.createElement('div');
    viewport.className = 'history_git_viewport';

    const canvas_container = document.createElement('div');
    canvas_container.className = 'history_git_canvas';

    viewport.appendChild(canvas_container);
    expanded_wrapper.appendChild(toolbar);
    expanded_wrapper.appendChild(viewport);

    panel.content_element.appendChild(expanded_wrapper);

    let is_currently_collapsed = true;
    let last_scrolled_uid: number | null = null;

    function set_collapsed(collapsed: boolean): void
    {
        is_currently_collapsed = collapsed;
        root_element.classList.toggle('is_sidebar_collapsed', collapsed);
        if (on_collapse_change)
        {
            on_collapse_change(collapsed);
        }
        if (!collapsed)
        {
            refresh();
        }
    }

    function refresh(): void
    {
        const prev_scroll_top = viewport.scrollTop;
        const prev_scroll_left = viewport.scrollLeft;

        const tree = get_history_tree();
        if (!tree)
        {
            strip_step_badge.textContent = '#0';
            btn_first.disabled = true;
            btn_prev_fork.disabled = true;
            btn_undo.disabled = true;
            btn_redo.disabled = true;
            btn_next_fork.disabled = true;
            btn_leaf.disabled = true;
            strip_btn_first.disabled = true;
            strip_btn_prev_fork.disabled = true;
            strip_btn_undo.disabled = true;
            strip_btn_redo.disabled = true;
            strip_btn_next_fork.disabled = true;
            strip_btn_leaf.disabled = true;
            canvas_container.innerHTML = '<div class="basic_ui_label_sub" style="padding:16px;">History not initialized.</div>';
            return;
        }

        const current_changed = last_scrolled_uid !== tree.current_uid;
        last_scrolled_uid = tree.current_uid;

        strip_step_badge.textContent = `#${tree.current_uid}`;

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

        strip_btn_first.disabled = !can_undo;
        strip_btn_prev_fork.disabled = !has_prev_fork;
        strip_btn_undo.disabled = !can_undo;
        strip_btn_redo.disabled = !can_redo;
        strip_btn_next_fork.disabled = !has_next_fork;
        strip_btn_leaf.disabled = !can_redo;

        if (is_currently_collapsed)
        {
            return;
        }

        canvas_container.innerHTML = '';

        const layout = compute_git_graph_layout(tree);
        if (layout.nodes.length === 0)
        {
            canvas_container.innerHTML = '<div class="basic_ui_label_sub" style="padding:16px;">No history records.</div>';
            return;
        }

        info_label.textContent = `HEAD @ #${tree.current_uid} (${layout.nodes.length} nodes)`;

        const graph_col_width = PAD_X + (layout.max_lane + 1) * LANE_WIDTH + 14;
        const total_height = layout.total_height;

        canvas_container.style.height = `${total_height}px`;

        // 1. SVG Curves: Smooth S-curve Bézier elbows on branch and vertical lines on trunk
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'history_git_svg');
        svg.setAttribute('width', String(graph_col_width));
        svg.setAttribute('height', String(total_height));

        for (const edge of layout.edges)
        {
            const color = get_lane_color(edge.lane);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            let d = '';
            if (edge.x1 === edge.x2)
            {
                // Straight vertical line for same-lane steps
                d = `M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`;
            }
            else
            {
                // Smooth Bézier elbow for branch out upwards
                const dy = Math.abs(edge.y1 - edge.y2);
                const curve_h = Math.min(ROW_HEIGHT, dy);
                const cy1 = edge.y1 - curve_h * 0.65;
                const cy2 = edge.y1 - curve_h * 0.35;
                const turn_y = edge.y1 - curve_h;

                if (edge.y2 === turn_y)
                {
                    d = `M ${edge.x1} ${edge.y1} C ${edge.x1} ${cy1}, ${edge.x2} ${cy2}, ${edge.x2} ${edge.y2}`;
                }
                else
                {
                    d = `M ${edge.x1} ${edge.y1} C ${edge.x1} ${cy1}, ${edge.x2} ${cy2}, ${edge.x2} ${turn_y} L ${edge.x2} ${edge.y2}`;
                }
            }

            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', '3');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(path);
        }

        // 2. Node Circles on SVG
        for (const n of layout.nodes)
        {
            const cx = PAD_X + n.lane * LANE_WIDTH;
            const cy = PAD_Y + n.row * ROW_HEIGHT + ROW_HEIGHT / 2;
            const color = get_lane_color(n.lane);

            // Halo for current HEAD
            if (n.is_current)
            {
                const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                halo.setAttribute('cx', String(cx));
                halo.setAttribute('cy', String(cy));
                halo.setAttribute('r', '9.5');
                halo.setAttribute('fill', 'rgba(56, 139, 253, 0.25)');
                halo.setAttribute('stroke', color);
                halo.setAttribute('stroke-width', '1.8');
                svg.appendChild(halo);
            }

            // Golden / amber halo for pinned / highlighted nodes
            const is_pinned = is_node_pinned(n.node.uid);
            if (is_pinned)
            {
                const pin_halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                pin_halo.setAttribute('cx', String(cx));
                pin_halo.setAttribute('cy', String(cy));
                pin_halo.setAttribute('r', '11.5');
                pin_halo.setAttribute('fill', 'rgba(249, 226, 175, 0.2)');
                pin_halo.setAttribute('stroke', HIGHLIGHT_COLOR);
                pin_halo.setAttribute('stroke-width', '2');
                pin_halo.setAttribute('stroke-dasharray', '3,2');
                svg.appendChild(pin_halo);
            }

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', String(cx));
            circle.setAttribute('cy', String(cy));
            circle.setAttribute('r', String(n.is_current ? NODE_RADIUS + 0.8 : NODE_RADIUS));
            circle.setAttribute('fill', n.is_current ? '#ffffff' : (is_pinned ? HIGHLIGHT_COLOR : color));
            circle.setAttribute('stroke', is_pinned ? HIGHLIGHT_COLOR : color);
            circle.setAttribute('stroke-width', '2.5');
            svg.appendChild(circle);
        }

        canvas_container.appendChild(svg);

        // 3. Node Row Elements (Details on the right)
        for (const n of layout.nodes)
        {
            const row_y = PAD_Y + n.row * ROW_HEIGHT;
            const label_str = n.node.command ? n.node.command.label : 'root (initial state)';
            const details = parse_command_details(label_str);
            const color = get_lane_color(n.lane);
            const is_pinned = is_node_pinned(n.node.uid);

            const row = document.createElement('div');
            row.className = 'history_git_row';
            if (n.is_current)
            {
                row.classList.add('is_current');
            }
            if (n.is_on_active_path)
            {
                row.classList.add('is_active_path');
            }
            if (is_pinned)
            {
                row.classList.add('is_highlighted');
            }

            row.style.top = `${row_y}px`;
            row.style.height = `${ROW_HEIGHT}px`;
            row.style.paddingLeft = `${graph_col_width + 8}px`;

            // Node Action Summary & Meta Badges
            const main_line = document.createElement('div');
            main_line.className = 'history_git_main_line';

            const icon_span = document.createElement('span');
            icon_span.className = 'history_git_icon';
            icon_span.textContent = details.icon;

            const target_span = document.createElement('span');
            target_span.className = 'history_git_target';
            target_span.textContent = details.target;
            target_span.title = label_str;

            main_line.appendChild(icon_span);
            main_line.appendChild(target_span);

            if (n.is_current)
            {
                const head_badge = document.createElement('span');
                head_badge.className = 'history_git_head_badge';
                head_badge.textContent = 'HEAD';
                main_line.appendChild(head_badge);
            }

            const uid_badge = document.createElement('span');
            uid_badge.className = 'history_git_uid_badge';
            uid_badge.textContent = `#${n.node.uid}`;
            main_line.appendChild(uid_badge);

            const actions_group = document.createElement('span');
            actions_group.className = 'history_git_actions';

            // 1. Toggle Pin (📌)
            const pin_btn = document.createElement('button');
            pin_btn.type = 'button';
            pin_btn.className = `history_git_row_btn pin_btn${is_pinned ? ' is_active' : ''}`;
            pin_btn.title = is_pinned ? `Unpin node #${n.node.uid}` : `Pin node #${n.node.uid} (highlight)`;
            pin_btn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>';
            pin_btn.addEventListener('click', (e) =>
            {
                e.stopPropagation();
                toggle_node_pin(n.node.uid);
                refresh();
            });
            actions_group.appendChild(pin_btn);

            if (n.node.uid !== 0)
            {
                // 2. Delete single node (✂️)
                const delete_node_btn = document.createElement('button');
                delete_node_btn.type = 'button';
                delete_node_btn.className = 'history_git_row_btn delete_node_btn';
                delete_node_btn.title = n.is_current ? 'Cannot delete current active node' : `Delete node #${n.node.uid} (re-parent children)`;
                delete_node_btn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

                if (n.is_current)
                {
                    delete_node_btn.disabled = true;
                }
                else
                {
                    delete_node_btn.addEventListener('click', (e) =>
                    {
                        e.stopPropagation();
                        delete_node(n.node.uid);
                    });
                }

                // 3. Delete branch (🗑️)
                const delete_branch_btn = document.createElement('button');
                delete_branch_btn.type = 'button';
                delete_branch_btn.className = 'history_git_row_btn delete_branch_btn';
                delete_branch_btn.title = n.is_on_active_path ? 'Cannot delete active branch (switch active branch first)' : `Delete branch rooted at #${n.node.uid} (prune subtree)`;
                delete_branch_btn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M15 4V2H9v2H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13zM9 8h2v9H9zm4 0h2v9h-2z"/></svg>';

                if (n.is_on_active_path)
                {
                    delete_branch_btn.disabled = true;
                }
                else
                {
                    delete_branch_btn.addEventListener('click', (e) =>
                    {
                        e.stopPropagation();
                        delete_branch(n.node.uid);
                    });
                }

                actions_group.appendChild(delete_node_btn);
                actions_group.appendChild(delete_branch_btn);
            }
            main_line.appendChild(actions_group);

            const sub_line = document.createElement('div');
            sub_line.className = 'history_git_sub_line';

            if (details.params)
            {
                const param_span = document.createElement('span');
                param_span.className = 'history_git_param';
                param_span.textContent = details.params;
                sub_line.appendChild(param_span);
            }

            const branch_badge = document.createElement('span');
            branch_badge.className = 'history_git_branch_badge';
            branch_badge.style.color = color;
            branch_badge.textContent = n.lane === 0 ? 'main' : `branch #${n.lane}`;
            sub_line.appendChild(branch_badge);

            row.appendChild(main_line);
            row.appendChild(sub_line);

            if (n.node.uid === 0)
            {
                row.title = `${label_str} — Click to jump (Root node cannot be deleted)`;
            }
            else if (n.is_current)
            {
                row.title = `${label_str} — Current active HEAD node (Jump away to delete)`;
            }
            else
            {
                row.title = `${label_str} — Left-click: Jump | Right-click: Delete node`;
            }

            row.addEventListener('click', () =>
            {
                jump_to_history(n.node.uid);
            });

            row.addEventListener('contextmenu', (e) =>
            {
                e.preventDefault();
                e.stopPropagation();

                if (n.node.uid === 0 || n.is_current)
                {
                    return;
                }

                delete_node(n.node.uid);
            });

            canvas_container.appendChild(row);
        }

        if (current_changed)
        {
            const current_layout = layout.nodes.find((n) => n.is_current);
            if (current_layout)
            {
                const current_row_y = PAD_Y + current_layout.row * ROW_HEIGHT;
                setTimeout(() =>
                {
                    const target_scroll = Math.max(0, current_row_y - viewport.clientHeight / 2 + ROW_HEIGHT / 2);
                    viewport.scrollTo({ top: target_scroll, behavior: 'smooth' });
                }, 50);
            }
        }
        else
        {
            viewport.scrollTop  = prev_scroll_top;
            viewport.scrollLeft = prev_scroll_left;
        }
    }

    on_history_change(() =>
    {
        refresh();
    });

    return {
        element:       panel.element,
        refresh,
        is_collapsed:  () => is_currently_collapsed,
        set_collapsed
    };
}
