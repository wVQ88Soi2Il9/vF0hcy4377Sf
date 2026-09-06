/**
 * Viewport Floating Panel Component
 *
 * 封裝 Canvas 畫布於獨立浮動 Panel，預設水平置左、垂直置中，並提供 Header Zoom 縮放控制器。
 */

import { basic_ui, type panel_component } from '@/packs/basic_ui';
import { basic_renderer } from '@/packs/basic_renderer';

export interface viewport_panel_component
{
    panel:           panel_component;
    content_element: HTMLElement;
    update_zoom_ui:  (zoom: number) => void;
}

export function create_viewport_panel(): viewport_panel_component
{
    const panel = basic_ui.create_floating_panel({
        id:          'viewport_panel',
        tag:         'main',
        title:       'Viewport',
        collapsible: false
    });

    const content = panel.content_element;
    content.className = 'basic_ui_content viewport_panel_content';

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

    function update_zoom_ui(zoom: number): void
    {
        const pct = Math.round((zoom / 40) * 100);
        zoom_badge.textContent = `${pct}%`;
    }

    btn_in.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        const cam = basic_renderer.get_camera_state();
        const next_zoom = Math.min(200, Math.round(cam.zoom * 1.25));
        basic_renderer.set_camera_zoom(next_zoom);
        update_zoom_ui(next_zoom);
    });

    btn_out.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        const cam = basic_renderer.get_camera_state();
        const next_zoom = Math.max(10, Math.round(cam.zoom * 0.8));
        basic_renderer.set_camera_zoom(next_zoom);
        update_zoom_ui(next_zoom);
    });

    btn_reset.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        basic_renderer.set_camera_zoom(40);
        update_zoom_ui(40);
    });

    // Subscribe to external camera updates (e.g. mouse wheel zoom on canvas)
    basic_renderer.on_camera_change((cam) =>
    {
        update_zoom_ui(cam.zoom);
    });

    // Initialize with current camera zoom
    const initial_cam = basic_renderer.get_camera_state();
    update_zoom_ui(initial_cam.zoom);

    return {
        panel,
        content_element: content,
        update_zoom_ui
    };
}
