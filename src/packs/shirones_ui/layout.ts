import { basic_ui, type splitter_component } from '@/packs/basic_ui';
import { create_info_bar, type info_bar_component } from './info_panel';
import { create_cli_bar, type cli_bar_component } from './cli_panel';
import { create_cad_timeline, type cad_timeline_component } from './history_tree_panel';
import { create_viewport_panel, type viewport_panel_component } from './viewport_panel';

export interface shirones_ui_layout_nodes
{
    root:           HTMLElement;
    viewport_panel: viewport_panel_component;
    info_bar:       info_bar_component;
    cad_timeline:   cad_timeline_component;
    cli_bar:        cli_bar_component;
}

/**
 * Creates the primary UI DOM layout structure with draggable splitters.
 * History Tree is on the left side (vertical Git Graph, default collapsed to 38px, expands to 40vw).
 * Center Column hosts Viewport (flex: 1) and CLI (default collapsed to 36px, expands to 100px).
 * Right Column hosts Map Status (default collapsed to 38px strip, expands to 240px inspector).
 */
export function create_ui_layout(): shirones_ui_layout_nodes
{
    const root = basic_ui.get_ui_root();
    root.innerHTML = '';

    // 1. Column Containers
    const history_sidebar = document.createElement('div');
    history_sidebar.className = 'basic_ui_history_sidebar';
    history_sidebar.style.flex = '0 0 38px';
    history_sidebar.style.width = '38px';

    const center_col = document.createElement('div');
    center_col.className = 'basic_ui_center_col';
    center_col.style.flex = '1';

    const right_col = document.createElement('div');
    right_col.className = 'basic_ui_right_col';
    right_col.style.flex = '0 0 38px';
    right_col.style.width = '38px';
    right_col.style.minWidth = '38px';
    right_col.style.maxWidth = '38px';

    let v_splitter_left: splitter_component | null = null;
    let v_splitter_right: splitter_component | null = null;
    let h_splitter: splitter_component | null = null;

    // 2. Components
    const cad_timeline = create_cad_timeline((collapsed: boolean) =>
    {
        if (collapsed)
        {
            history_sidebar.style.flex = '0 0 38px';
            history_sidebar.style.width = '38px';
            if (v_splitter_left)
            {
                v_splitter_left.element.style.display = 'none';
            }
        }
        else
        {
            history_sidebar.style.flex = '0 0 max(25vw, 450px)';
            history_sidebar.style.width = 'max(25vw, 450px)';
            if (v_splitter_left)
            {
                v_splitter_left.element.style.display = '';
            }
        }
    });

    const viewport_panel = create_viewport_panel();
    viewport_panel.panel.element.style.flex = '1';

    const cli_bar = create_cli_bar((collapsed: boolean) =>
    {
        if (collapsed)
        {
            cli_bar.element.style.flex = '0 0 36px';
            cli_bar.element.style.height = '36px';
            if (h_splitter)
            {
                h_splitter.element.style.display = 'none';
            }
        }
        else
        {
            cli_bar.element.style.flex = '0 0 100px';
            cli_bar.element.style.height = '100px';
            if (h_splitter)
            {
                h_splitter.element.style.display = '';
            }
        }
    });
    cli_bar.element.style.flex = '0 0 36px';
    cli_bar.element.style.height = '36px';

    const info_bar = create_info_bar((collapsed: boolean) =>
    {
        if (collapsed)
        {
            right_col.style.flex = '0 0 38px';
            right_col.style.width = '38px';
            right_col.style.minWidth = '38px';
            right_col.style.maxWidth = '38px';
            if (v_splitter_right)
            {
                v_splitter_right.element.style.display = 'none';
            }
        }
        else
        {
            right_col.style.flex = '0 0 360px';
            right_col.style.width = '360px';
            right_col.style.minWidth = '240px';
            right_col.style.maxWidth = '600px';
            if (v_splitter_right)
            {
                v_splitter_right.element.style.display = '';
            }
        }
    });

    // 3. Assemble Center Column
    h_splitter = basic_ui.create_splitter({
        direction: 'horizontal',
        prev_el:   viewport_panel.panel.element,
        next_el:   cli_bar.element,
        min_prev:  120,
        min_next:  36
    });
    h_splitter.element.style.display = 'none';

    center_col.appendChild(viewport_panel.panel.element);
    center_col.appendChild(h_splitter.element);
    center_col.appendChild(cli_bar.element);

    // 4. Assemble Sidebars
    history_sidebar.appendChild(cad_timeline.element);
    right_col.appendChild(info_bar.element);

    // 5. Create Vertical Splitters
    v_splitter_left = basic_ui.create_splitter({
        direction: 'vertical',
        prev_el:   history_sidebar,
        next_el:   center_col,
        min_prev:  38,
        min_next:  300
    });
    v_splitter_left.element.style.display = 'none';

    v_splitter_right = basic_ui.create_splitter({
        direction: 'vertical',
        prev_el:   center_col,
        next_el:   right_col,
        min_prev:  300,
        min_next:  240
    });
    v_splitter_right.element.style.display = 'none';

    // 6. Assemble Root Layout
    root.appendChild(history_sidebar);
    root.appendChild(v_splitter_left.element);
    root.appendChild(center_col);
    root.appendChild(v_splitter_right.element);
    root.appendChild(right_col);

    return { root, viewport_panel, info_bar, cad_timeline, cli_bar };
}
