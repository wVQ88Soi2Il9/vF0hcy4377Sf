export interface ui_layout_nodes
{
    root:     HTMLElement;
    viewport: HTMLElement;
}

/**
 * Creates the primary UI DOM layout structure.
 * Returns the root element and the viewport container for canvas embedding.
 */
export function create_ui_layout(): ui_layout_nodes
{
    const root = document.createElement('div');
    root.id = 'ui_root';
    root.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden;pointer-events:none;';

    const viewport = document.createElement('div');
    viewport.id = 'canvas_viewport';
    viewport.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:auto;';

    root.appendChild(viewport);

    return { root, viewport };
}
