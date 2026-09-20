import * as core from '@/core';
import * as world from '@/world';
import * as vanilla_beta from '@/packs/vanilla_beta';
import { button, create_panel, element, error_message } from './dom';

export function create_history_tree(target_world: world.pure_world, on_change?: (collapsed: boolean) => void)
{
    const panel = create_panel('History', collapsed => { on_change?.(collapsed); if (!collapsed) { refresh(); } });
    const navigation = element('nav', 'gpts_navigation');
    const badge = element('small');
    const graph = element('div', 'gpts_graph');
    const error = element('p', 'gpts_error');
    panel.header.append(badge);
    panel.element.insertBefore(navigation, panel.body);
    panel.body.append(error, graph);
    let previous_uid: number | null = null;
    const notify = (id: string) => target_world.trigger({ namespace: 'vanilla_alpha', id }, target_world);
    function act(action: () => void): void
    {
        error.textContent = '';
        try { action(); }
        catch (cause) { error.textContent = error_message(cause); }
        refresh();
    }
    const specs = [
        ['Root', core.jump_to_root, 'history_undo', 'root'],
        ['Previous fork', core.jump_to_prev_fork, 'history_undo', 'previous_fork'],
        ['Undo', core.jump_prev_node, 'history_undo', 'undo'],
        ['Redo', core.jump_next_node, 'history_redo', 'redo'],
        ['Next fork / end', core.jump_to_next_fork, 'history_redo', 'next_fork']
    ] as const;
    const controls = specs.map(([label, action, hook, icon]) =>
    {
        const control = button(label, () => act(() =>
        {
            const before = target_world.history.current_history_uid;
            action(target_world.history, target_world.space);
            if (before !== target_world.history.current_history_uid) { notify(hook); }
        }), icon);
        navigation.append(control);
        return control;
    });
    function refresh(): void
    {
        const tree = target_world.history;
        const current = tree.nodes.get(tree.current_history_uid)!;
        badge.textContent = `HEAD #${current.history_uid} · ${tree.nodes.size} nodes`;
        controls.forEach((control, index) => { control.disabled = index < 3 ? current.parent_history_uid === null : current.children_history_uids.length !== 1; });
        if (panel.is_collapsed()) { return; }
        const scroll = { top: panel.body.scrollTop, left: panel.body.scrollLeft };
        const active = new Set<number>();
        let ancestor: number | null = current.history_uid;
        while (ancestor !== null)
        {
            active.add(ancestor);
            ancestor = tree.nodes.get(ancestor)!.parent_history_uid;
        }
        const ascending = [...tree.nodes.values()].sort((a, b) => a.history_uid - b.history_uid);
        const lanes = new Map<number, number>();
        let next_lane = 1;
        for (const node of ascending)
        {
            const parent = node.parent_history_uid === null ? null : tree.nodes.get(node.parent_history_uid)!;
            lanes.set(node.history_uid, !parent ? 0 : parent.children_history_uids[0] === node.history_uid ? lanes.get(parent.history_uid)! : next_lane++);
        }
        const nodes = ascending.reverse();
        const rows = new Map(nodes.map((node, index) => [node.history_uid, index]));
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const width = 24 * next_lane + 20;
        svg.setAttribute('width', String(width));
        svg.setAttribute('height', String(nodes.length * 64));
        svg.setAttribute('aria-hidden', 'true');
        graph.replaceChildren(svg);
        graph.style.minWidth = `${width + 280}px`;
        const color = (lane: number) => `hsl(${(lane * 83 + 210) % 360} 70% 65%)`;
        function shape(tag: 'path' | 'circle', attributes: Record<string, string>): void
        {
            const node = document.createElementNS(svg.namespaceURI, tag);
            for (const [key, value] of Object.entries(attributes)) { node.setAttribute(key, value); }
            svg.append(node);
        }
        for (const node of nodes)
        {
            const lane = lanes.get(node.history_uid)!;
            const x = lane * 24 + 14;
            const y = rows.get(node.history_uid)! * 64 + 32;
            if (node.parent_history_uid !== null)
            {
                const px = lanes.get(node.parent_history_uid)! * 24 + 14;
                const py = rows.get(node.parent_history_uid)! * 64 + 32;
                shape('path', { d: `M ${x} ${y} C ${x} ${py - 24}, ${px} ${py - 24}, ${px} ${py}`, stroke: color(lane), fill: 'none', 'stroke-width': '2' });
            }
            const pinned = vanilla_beta.is_node_pinned(tree, node.history_uid);
            shape('circle', { cx: String(x), cy: String(y), r: node === current ? '7' : '5', fill: pinned ? '#ffd56a' : color(lane), stroke: node === current ? 'white' : color(lane), 'stroke-width': '2' });
            const row = element('div', 'gpts_history_row');
            row.style.paddingLeft = `${width}px`;
            row.classList.toggle('gpts_active_path', active.has(node.history_uid));
            row.classList.toggle('gpts_current', node === current);
            row.classList.toggle('gpts_pinned', pinned);
            row.setAttribute('data-history-uid', String(node.history_uid));
            const summary = node.operations.map(operation => `${operation.namespace}:${operation.id} ${JSON.stringify(operation.other_info?.vanilla_alpha ?? operation.other_info ?? {})}`).join('; ') || 'Initial state';
            const jump = button(`${node === current ? 'HEAD ' : ''}#${node.history_uid} · ${summary}`, () => act(() =>
            {
                const before = tree.current_history_uid;
                core.jump_to_node(tree, target_world.space, node.history_uid);
                if (before !== tree.current_history_uid) { notify('history_change'); }
            }));
            jump.className = 'gpts_history_label';
            const actions = element('div');
            const pin = button(pinned ? 'Unpin' : 'Pin', () => act(() => { vanilla_beta.toggle_node_pin(tree, node.history_uid); notify('history_change'); }), pinned ? 'unpin' : 'pin');
            pin.setAttribute('aria-pressed', String(pinned));
            function remove_leaf(): void
            {
                if (core.delete_node(tree, node.history_uid)) { notify('history_delete'); }
            }
            const leaf = button('Delete leaf', () => act(remove_leaf), 'cut');
            leaf.disabled = node.history_uid === 0 || node === current || node.children_history_uids.length > 0;
            const branch = button('Delete branch', () => act(() => { if (vanilla_beta.delete_branch(tree, node.history_uid)) { notify('history_delete'); } }), 'trash');
            branch.disabled = active.has(node.history_uid) || node.history_uid === 0;
            row.addEventListener('contextmenu', event => { event.preventDefault(); if (!leaf.disabled) { act(remove_leaf); } });
            actions.append(element('small', '', `branch ${lane} `), pin, leaf, branch);
            row.append(jump, actions);
            graph.append(row);
        }
        if (previous_uid !== current.history_uid)
        {
            panel.body.scrollTop = Math.max(0, rows.get(current.history_uid)! * 64 - panel.body.clientHeight / 2 + 32);
        }
        else
        {
            panel.body.scrollTop = scroll.top;
            panel.body.scrollLeft = scroll.left;
        }
        previous_uid = current.history_uid;
    }
    const unsubscribe = target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'history_change' }, refresh);
    refresh();
    return { ...panel, refresh, destroy: unsubscribe };
}
