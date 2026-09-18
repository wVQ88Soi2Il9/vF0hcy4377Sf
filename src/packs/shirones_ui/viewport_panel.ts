/**
 * Viewport Floating Panel Component
 *
 * 封裝 Canvas 畫布於獨立浮動 Panel，預設水平置左、垂直置中，並提供 Header Zoom 縮放控制器。
 */

import { create_panel_view, type panel_view } from './panel_view';

export interface viewport_panel_component
{
    panel:           panel_view;
    content_element: HTMLElement;
    update_zoom_ui:  (zoom: number) => void;
}

export function create_viewport_panel(): viewport_panel_component
{
    const panel = create_panel_view({
        id:    'viewport_panel',
        tag:   'main',
        title: 'Viewport'
    });

    const content = panel.content_element;
    content.className = 'md3_panel_content viewport_panel_content';

    // Header Zoom Controls
    const zoom_wrap = document.createElement('div');
    zoom_wrap.className = 'viewport_zoom_controls';

    const btn_out = document.createElement('button');
    btn_out.className = 'viewport_zoom_btn';
    btn_out.textContent = '−';
    btn_out.title = 'Zoom out';

    const zoom_badge = document.createElement('span');
    zoom_badge.className = 'viewport_zoom_badge';
    zoom_badge.textContent = '100%';

    const btn_in = document.createElement('button');
    btn_in.className = 'viewport_zoom_btn';
    btn_in.textContent = '+';
    btn_in.title = 'Zoom in';

    const btn_reset = document.createElement('button');
    btn_reset.className = 'viewport_zoom_btn reset';
    btn_reset.textContent = '⟲';
    btn_reset.title = 'Reset zoom (100%)';

    zoom_wrap.appendChild(btn_out);
    zoom_wrap.appendChild(zoom_badge);
    zoom_wrap.appendChild(btn_in);
    zoom_wrap.appendChild(btn_reset);

    panel.header_element.appendChild(zoom_wrap);

    let current_zoom = 40;

    function update_zoom_ui(zoom: number): void
    {
        const pct = Math.round((zoom / 40) * 100);
        zoom_badge.textContent = `${pct}%`;
    }

    btn_in.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        const next_zoom = Math.min(200, Math.round(current_zoom * 1.25));
        current_zoom = next_zoom;
        update_zoom_ui(next_zoom);
    });

    btn_out.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        const next_zoom = Math.max(10, Math.round(current_zoom * 0.8));
        current_zoom = next_zoom;
        update_zoom_ui(next_zoom);
    });

    btn_reset.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        current_zoom = 40;
        update_zoom_ui(40);
    });

    update_zoom_ui(current_zoom);

    return {
        panel,
        content_element: content,
        update_zoom_ui
    };
}
