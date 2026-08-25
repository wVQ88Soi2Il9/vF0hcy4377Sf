import type { history_tree } from '@/core';
import { find_next_fork_node } from '@/core';
import
{
    jump_to_history,
    undo,
    redo,
    jump_to_prev_fork,
    jump_to_next_fork,
    jump_to_leaf
} from '@/runtime';

export interface navigation_button_spec
{
    id:            string;
    strip_title:   string;
    toolbar_title: string;
    svg_paths:     string;
    action:        () => void;
    can_execute:   (tree: history_tree) => boolean;
}

export interface navigation_button_group
{
    container:    HTMLElement;
    buttons:      HTMLButtonElement[];
    update_state: (tree: history_tree | null) => void;
}

export const NAVIGATION_BUTTON_SPECS: readonly navigation_button_spec[] = [
    {
        id:            'root',
        strip_title:   'Jump to Root',
        toolbar_title: 'Jump to initial state (Root)',
        svg_paths:     '<rect x="3" y="4" width="2.5" height="16" rx="1"/><path d="M12.5 12l8.5 6.5V5.5z"/><path d="M5.5 12l8.5 6.5V5.5z"/>',
        action:        () => { jump_to_history(0); },
        can_execute:   (tree: history_tree) => tree.current_uid !== 0
    },
    {
        id:            'prev_fork',
        strip_title:   'Jump to Prev Fork',
        toolbar_title: 'Jump to previous fork',
        svg_paths:     '<path d="M11 12l9.5 7V5z"/><path d="M2 12l9.5 7V5z"/>',
        action:        () => { jump_to_prev_fork(); },
        can_execute:   (tree: history_tree) => tree.current_uid !== 0
    },
    {
        id:            'undo',
        strip_title:   'Undo (Ctrl+Z)',
        toolbar_title: 'Step back (Undo)',
        svg_paths:     '<path d="M18 4.5v15l-13-7.5z"/>',
        action:        () => { undo(); },
        can_execute:   (tree: history_tree) => tree.current_uid !== 0
    },
    {
        id:            'redo',
        strip_title:   'Redo (Ctrl+Y)',
        toolbar_title: 'Step forward (Redo)',
        svg_paths:     '<path d="M6 4.5v15l13-7.5z"/>',
        action:        () => { redo(); },
        can_execute:   (tree: history_tree) =>
        {
            const node = tree.nodes.get(tree.current_uid);
            return node ? node.children_uids.length > 0 : false;
        }
    },
    {
        id:            'next_fork',
        strip_title:   'Jump to Next Fork',
        toolbar_title: 'Jump to next fork',
        svg_paths:     '<path d="M13 12L3.5 5v14z"/><path d="M22 12l-9.5-7v14z"/>',
        action:        () => { jump_to_next_fork(); },
        can_execute:   (tree: history_tree) => find_next_fork_node(tree, tree.current_uid) !== null
    },
    {
        id:            'leaf',
        strip_title:   'Jump to Leaf (Branch End)',
        toolbar_title: 'Jump to latest step (End of branch)',
        svg_paths:     '<rect x="18.5" y="4" width="2.5" height="16" rx="1"/><path d="M11.5 12L3 5.5v13z"/><path d="M18.5 12L10 5.5v13z"/>',
        action:        () => { jump_to_leaf(); },
        can_execute:   (tree: history_tree) =>
        {
            const node = tree.nodes.get(tree.current_uid);
            return node ? node.children_uids.length > 0 : false;
        }
    }
];

/**
 * Creates a navigation button group for either collapsed strip or expanded toolbar.
 */
export function create_navigation_button_group
(
    container_class: string,
    btn_class:       string,
    mode:            'strip' | 'toolbar'
): navigation_button_group
{
    const container = document.createElement('div');
    container.className = container_class;

    const button_entries: Array<{ element: HTMLButtonElement; spec: navigation_button_spec }> = [];

    for (const spec of NAVIGATION_BUTTON_SPECS)
    {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = btn_class;
        btn.title = mode === 'strip' ? spec.strip_title : spec.toolbar_title;
        const icon_size = mode === 'strip' ? 12 : 13;
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="${icon_size}" height="${icon_size}" fill="currentColor">${spec.svg_paths}</svg>`;

        btn.addEventListener('click', (e) =>
        {
            e.stopPropagation();
            spec.action();
        });

        container.appendChild(btn);
        button_entries.push({ element: btn, spec });
    }

    function update_state(tree: history_tree | null): void
    {
        if (!tree)
        {
            for (const entry of button_entries)
            {
                entry.element.disabled = true;
            }
            return;
        }

        for (const entry of button_entries)
        {
            entry.element.disabled = !entry.spec.can_execute(tree);
        }
    }

    return {
        container,
        buttons: button_entries.map(e => e.element),
        update_state
    };
}
