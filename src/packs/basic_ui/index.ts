import { basic_renderer } from '@/packs/basic_renderer';
import { get_map } from '@/runtime';
import { on_device_change } from '@/API';
import { create_ui_layout } from './layout';
import type { info_bar_component } from './info_bar';
import {
    register_device_inspector,
    register_device_action,
    register_panel_section
} from './extensions';

export type {
    device_action,
    device_inspector_fn,
    panel_section_fn
} from './extensions';

let active_info_bar: info_bar_component | null = null;

/**
 * basic_ui entry point.
 * Initializes the main UI layout, attaches it to the DOM host (#app),
 * embeds the canvas element into the viewport container, and sets up ResizeObserver
 * to sync viewport dimensions with the renderer.
 */
export function init_pack(): void
{
    const host = document.getElementById('app') ?? document.body;
    const { root, viewport, info_bar } = create_ui_layout();
    active_info_bar = info_bar;

    host.appendChild(root);

    const canvas = basic_renderer.get_canvas();
    if (canvas)
    {
        viewport.appendChild(canvas);
    }

    const observer = new ResizeObserver((entries) =>
    {
        for (const entry of entries)
        {
            const { width, height } = entry.contentRect;
            basic_renderer.resize_canvas(Math.floor(width), Math.floor(height));
        }
    });

    observer.observe(viewport);

    function update_map_info(): void
    {
        const map = get_map();
        if (map)
        {
            const device_count = map.devices.length;
            const map_dimensions = map.size.join(' × ');
            info_bar.update_stats({ device_count, map_dimensions });
        }
    }

    update_map_info();
    on_device_change(update_map_info);
}

export function display_device_info(uid: number): boolean
{
    return active_info_bar ? active_info_bar.display_device_info(uid) : false;
}

export function clear_device_info(): void
{
    if (active_info_bar)
    {
        active_info_bar.clear_device_info();
    }
}

/**
 * Object export for basic_ui pack interface.
 */
export const basic_ui = {
    display_device_info,
    clear_device_info,
    register_device_inspector,
    register_device_action,
    register_panel_section
};
