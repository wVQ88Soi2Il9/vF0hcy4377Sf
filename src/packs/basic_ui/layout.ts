import { create_info_bar, type info_bar_component } from './info_bar';
import { create_cli_bar, type cli_bar_component } from './cli_bar';

export interface ui_layout_nodes
{
    root:     HTMLElement;
    viewport: HTMLElement;
    info_bar: info_bar_component;
    cli_bar:  cli_bar_component;
}

/**
 * Creates the primary UI DOM layout structure.
 * Returns the root element, viewport, info_bar, and cli_bar components.
 */
export function create_ui_layout(): ui_layout_nodes
{
    const root = document.createElement('div');
    root.id = 'ui_root';
    root.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden;pointer-events:none;';

    const viewport = document.createElement('div');
    viewport.id = 'canvas_viewport';
    viewport.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:auto;';

    const info_bar = create_info_bar();
    const cli_bar  = create_cli_bar();

    root.appendChild(viewport);
    root.appendChild(info_bar.element);
    root.appendChild(cli_bar.element);

    return { root, viewport, info_bar, cli_bar };
}

