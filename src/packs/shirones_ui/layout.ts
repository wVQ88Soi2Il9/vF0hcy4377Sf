import { basic_ui } from '@/packs/basic_ui';
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
 */
export function create_ui_layout(): shirones_ui_layout_nodes
{
    const root = basic_ui.get_ui_root();
    root.innerHTML = '';

    // Left Column (History Tree + Viewport + CLI)
    const left_col = document.createElement('div');
    left_col.className = 'basic_ui_left_col';
    left_col.style.flex = '10';

    // Right Column (Map Status: 預設縮小寬度)
    const right_col = document.createElement('div');
    right_col.className = 'basic_ui_right_col';
    right_col.style.flex = '2';

    // 預設縮小 History Tree
    const cad_timeline   = create_cad_timeline();
    cad_timeline.element.style.flex = '1.2';

    // 主畫面 Viewport 最大化
    const viewport_panel = create_viewport_panel();
    viewport_panel.panel.element.style.flex = '7.5';

    // 預設縮小 CLI
    const cli_bar        = create_cli_bar();
    cli_bar.element.style.flex = '0.6';

    const info_bar       = create_info_bar();
    info_bar.element.style.flex = '1';

    // Horizontal Splitter 1: between History Tree and Viewport
    const h_splitter_1 = basic_ui.create_splitter({
        direction: 'horizontal',
        prev_el:   cad_timeline.element,
        next_el:   viewport_panel.panel.element,
        min_prev:  60,
        min_next:  120
    });

    // Horizontal Splitter 2: between Viewport and CLI
    const h_splitter_2 = basic_ui.create_splitter({
        direction: 'horizontal',
        prev_el:   viewport_panel.panel.element,
        next_el:   cli_bar.element,
        min_prev:  120,
        min_next:  40
    });

    // Vertical Splitter: between Left Column and Right Column
    const v_splitter = basic_ui.create_splitter({
        direction: 'vertical',
        prev_el:   left_col,
        next_el:   right_col,
        min_prev:  300,
        min_next:  180
    });

    // Assemble Left Column
    left_col.appendChild(cad_timeline.element);
    left_col.appendChild(h_splitter_1.element);
    left_col.appendChild(viewport_panel.panel.element);
    left_col.appendChild(h_splitter_2.element);
    left_col.appendChild(cli_bar.element);

    // Assemble Right Column
    right_col.appendChild(info_bar.element);

    // Assemble Root
    root.appendChild(left_col);
    root.appendChild(v_splitter.element);
    root.appendChild(right_col);

    return { root, viewport_panel, info_bar, cad_timeline, cli_bar };
}
