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
 * Center Column hosts Viewport (flex: 1) and CLI (default collapsed to 36px, expands to 100px).
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

    // 2. Components
    const cad_timeline = create_history_tree(target_world, (collapsed: boolean) =>
    {
        root_layout?.reset_sizes();

        if (collapsed)
        {
            history_sidebar.style.flex = '0 0 38px';
            history_sidebar.style.width = '38px';
        }
        else
        {
            history_sidebar.style.flex = '0 0 max(25vw, 450px)';
            history_sidebar.style.width = 'max(25vw, 450px)';
        }

        if (root_layout)
        {
            root_layout.resize_handles[0].hidden = collapsed;
        }
    });

    const viewport_panel = create_viewport_panel();
    viewport_panel.panel.element.style.flex = '1';
    viewport_panel.panel.element.style.minHeight = '120px';

    const cli_bar = create_cli_bar(target_world, (collapsed: boolean) =>
    {
        center_layout?.reset_sizes();

        if (collapsed)
        {
            cli_bar.element.style.flex = '0 0 36px';
            cli_bar.element.style.height = '36px';
        }
        else
        {
            cli_bar.element.style.flex = '0 0 100px';
            cli_bar.element.style.height = '100px';
        }

        if (center_layout)
        {
            center_layout.resize_handles[0].hidden = collapsed;
        }
    });
    cli_bar.element.style.flex = '0 0 36px';
    cli_bar.element.style.height = '36px';
    cli_bar.element.style.minHeight = '36px';

    const info_bar = create_info_bar(target_world, (collapsed: boolean) =>
    {
        root_layout?.reset_sizes();

        if (collapsed)
        {
            right_col.style.flex = '0 0 38px';
            right_col.style.width = '38px';
            right_col.style.minWidth = '38px';
            right_col.style.maxWidth = '38px';
        }
        else
        {
            right_col.style.flex = '0 0 360px';
            right_col.style.width = '360px';
            right_col.style.minWidth = '240px';
            right_col.style.maxWidth = '600px';
        }

        if (root_layout)
        {
            root_layout.resize_handles[1].hidden = collapsed;
        }
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
