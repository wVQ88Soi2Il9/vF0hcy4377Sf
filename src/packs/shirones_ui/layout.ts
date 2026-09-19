import type * as world from '@/world';
import { fill_panels, type panel_layout } from '@/packs/panel';
import { create_info_bar, type info_bar_component } from './info_panel';
import { create_cli_bar, type cli_bar_component } from './cli_panel';
import { create_history_tree, type history_tree_component } from './history_tree_panel';
import { create_viewport_panel, type viewport_panel_component } from './viewport_panel';

export interface shirones_ui_layout_nodes
{
    root:           HTMLElement;
    viewport_panel: viewport_panel_component;
    info_bar:       info_bar_component;
    cad_timeline:   history_tree_component;
    cli_bar:        cli_bar_component;
}

function get_ui_root(): HTMLElement
{
    let root = document.getElementById('ui_root');
    if (!root)
    {
        root = document.createElement('div');
        root.id = 'ui_root';
        (document.getElementById('app') ?? document.body).appendChild(root);
    }
    root.className = 'basic_ui_splitter_layout';
    return root;
}

/**
 * Creates the primary UI DOM layout structure with draggable splitters.
 * History Tree is on the left side (vertical Git Graph, default collapsed to 38px, expands to 40vw).
 * Center Column hosts Viewport (flex: 1) and CLI (default collapsed to 40px, expands to 100px).
 * Right Column hosts Map Status (default collapsed to 38px strip, expands to 240px inspector).
 */
export function create_ui_layout(target_world: world.pure_world): shirones_ui_layout_nodes
{
    const root = get_ui_root();

    // 1. Column Containers
    const history_sidebar = document.createElement('div');
    history_sidebar.className = 'basic_ui_history_sidebar';
    history_sidebar.style.flex = '0 0 38px';
    history_sidebar.style.width = '38px';
    history_sidebar.style.minWidth = '38px';

    const center_col = document.createElement('div');
    center_col.className = 'basic_ui_center_col';
    center_col.style.flex = '1';
    center_col.style.minWidth = '300px';

    const right_col = document.createElement('div');
    right_col.className = 'basic_ui_right_col';
    right_col.style.flex = '0 0 38px';
    right_col.style.width = '38px';
    right_col.style.minWidth = '38px';
    right_col.style.maxWidth = '38px';

    let root_layout: panel_layout | null = null;
    let center_layout: panel_layout | null = null;
    let history_collapsed = true;
    let info_collapsed = true;
    let cli_collapsed = true;
    let history_expanded_size = 'max(25vw, 450px)';
    let info_expanded_size = '360px';
    let cli_expanded_size = '100px';

    function remember_root_sizes(): void
    {
        if (!history_collapsed)
        {
            history_expanded_size = `${history_sidebar.getBoundingClientRect().width}px`;
        }
        if (!info_collapsed)
        {
            info_expanded_size = `${right_col.getBoundingClientRect().width}px`;
        }
    }

    function apply_root_sizes(): void
    {
        const history_size = history_collapsed ? '38px' : history_expanded_size;
        history_sidebar.style.flex = `0 0 ${history_size}`;
        history_sidebar.style.width = history_size;
        history_sidebar.style.minWidth = history_collapsed ? '38px' : '150px';

        const info_size = info_collapsed ? '38px' : info_expanded_size;
        right_col.style.flex = `0 0 ${info_size}`;
        right_col.style.width = info_size;
        right_col.style.minWidth = info_collapsed ? '38px' : '200px';
        right_col.style.maxWidth = info_collapsed ? '38px' : '600px';

        if (root_layout)
        {
            root_layout.resize_handles[0].hidden = history_collapsed;
            root_layout.resize_handles[1].hidden = info_collapsed;
        }
    }

    function apply_cli_size(): void
    {
        const cli_size = cli_collapsed ? '40px' : cli_expanded_size;
        cli_bar.element.style.flex = `0 0 ${cli_size}`;
        cli_bar.element.style.height = cli_size;

        if (center_layout)
        {
            center_layout.resize_handles[0].hidden = cli_collapsed;
        }
    }

    // 2. Components
    const cad_timeline = create_history_tree(target_world, (collapsed: boolean) =>
    {
        remember_root_sizes();
        root_layout?.reset_sizes();
        history_collapsed = collapsed;
        apply_root_sizes();
    });

    const viewport_panel = create_viewport_panel();
    viewport_panel.panel.element.style.flex = '1';
    viewport_panel.panel.element.style.minHeight = '120px';

    const cli_bar = create_cli_bar(target_world, (collapsed: boolean) =>
    {
        if (!cli_collapsed)
        {
            cli_expanded_size = `${cli_bar.element.getBoundingClientRect().height}px`;
        }
        center_layout?.reset_sizes();
        cli_collapsed = collapsed;
        apply_cli_size();
    });
    cli_bar.element.style.flex = '0 0 40px';
    cli_bar.element.style.height = '40px';
    cli_bar.element.style.minHeight = '40px';

    const info_bar = create_info_bar(target_world, (collapsed: boolean) =>
    {
        remember_root_sizes();
        root_layout?.reset_sizes();
        info_collapsed = collapsed;
        apply_root_sizes();
    });

    center_layout = fill_panels(
        center_col,
        [viewport_panel.panel, cli_bar],
        { direction: 'column' }
    );
    center_layout.resize_handles[0].hidden = true;

    fill_panels(history_sidebar, [cad_timeline], { direction: 'column' });
    fill_panels(right_col, [info_bar], { direction: 'column' });

    root_layout = fill_panels(root, [
        { element: history_sidebar },
        { element: center_col },
        { element: right_col }
    ]);
    root_layout.resize_handles[0].hidden = true;
    root_layout.resize_handles[1].hidden = true;

    return { root, viewport_panel, info_bar, cad_timeline, cli_bar };
}
