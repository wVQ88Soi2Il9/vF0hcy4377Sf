import { basic_renderer } from '@/packs/basic_renderer';
import { get_map } from '@/runtime';
import type { unsubscribe_function } from '@/API';
import { on_device_change } from '@/API';
import { create_ui_layout } from './layout';
import { init_keybindings } from './keybindings';
import {
    set_active_info_bar,
    display_device_info,
    clear_device_info
} from './ui_state';
import {
    register_device_inspector,
    unregister_device_inspector,
    register_device_action,
    unregister_device_action,
    register_panel_section,
    unregister_panel_section,
    clear_all_extensions
} from './extensions';

export type {
    device_action,
    device_inspector_fn,
    panel_section_fn
} from './extensions';

export {
    display_device_info,
    clear_device_info
} from './ui_state';

let cleanup_device_change: unsubscribe_function | null = null;
let cleanup_keybindings:   (() => void) | null         = null;

/**
 * basic_ui entry point.
 * Initializes the main UI layout, attaches it to the DOM host (#app),
 * embeds the canvas element into the viewport container, and sets up ResizeObserver
 * to sync viewport dimensions with the renderer.
 */
export function init_pack(): void
{
    if (cleanup_device_change)
    {
        cleanup_device_change();
        cleanup_device_change = null;
    }

    if (cleanup_keybindings)
    {
        cleanup_keybindings();
        cleanup_keybindings = null;
    }

    cleanup_keybindings = init_keybindings();

    const host = document.getElementById('app') ?? document.body;
    const { root, viewport, info_bar } = create_ui_layout();
    set_active_info_bar(info_bar);

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
    cleanup_device_change = on_device_change(update_map_info);
}

/**
 * Object export for basic_ui pack interface.
 */
export const basic_ui = {
    display_device_info,
    clear_device_info,
    register_device_inspector,
    unregister_device_inspector,
    register_device_action,
    unregister_device_action,
    register_panel_section,
    unregister_panel_section,
    clear_all_extensions
};
