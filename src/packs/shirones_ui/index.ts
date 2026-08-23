import './style.css';
import { basic_renderer } from '@/packs/basic_renderer';
import { basic_ui } from '@/packs/basic_ui';
import { get_map } from '@/runtime';
import type { unsubscribe_function } from '@/API';
import { on_device_change } from '@/API';
import { create_ui_layout, type shirones_ui_layout_nodes } from './layout';
import { create_info_bar, type info_bar_component } from './info_panel';
import { create_cli_bar, type cli_bar_component } from './cli_panel';
import { create_history_tree, type history_tree_component } from './history_tree_panel';
import { create_viewport_panel, type viewport_panel_component } from './viewport_panel';

export type {
    shirones_ui_layout_nodes,
    info_bar_component,
    cli_bar_component,
    history_tree_component as cad_timeline_component,
    viewport_panel_component
};

export {
    create_ui_layout,
    create_info_bar,
    create_cli_bar,
    create_history_tree as create_cad_timeline,
    create_viewport_panel
};

let cleanup_device_change: unsubscribe_function | null = null;
let active_layout: shirones_ui_layout_nodes | null = null;

/**
 * shirones_ui entry point.
 * Initializes the main UI layout, mounts it to the DOM host (#app via basic_ui),
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

    const layout = create_ui_layout();
    active_layout = layout;

    // Register active info bar to basic_ui device info handler
    basic_ui.set_device_info_handler({
        display_device_info: (uid: number) => layout.info_bar.display_device_info(uid),
        clear_device_info:   () => layout.info_bar.clear_device_info()
    });

    const canvas = basic_renderer.get_canvas();
    if (canvas)
    {
        layout.viewport_panel.content_element.appendChild(canvas);
    }

    const observer = new ResizeObserver((entries) =>
    {
        for (const entry of entries)
        {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0)
            {
                basic_renderer.resize_canvas(Math.floor(width), Math.floor(height));
            }
        }
    });

    observer.observe(layout.viewport_panel.content_element);

    function update_map_info(): void
    {
        const map = get_map();
        if (map)
        {
            const device_count = map.devices.length;
            const map_dimensions = map.size.join(' × ');
            layout.info_bar.update_stats({ device_count, map_dimensions });
        }
    }

    update_map_info();
    queueMicrotask(() => update_map_info());
    cleanup_device_change = on_device_change(update_map_info);
}

/**
 * Object export for shirones_ui pack interface.
 */
export const shirones_ui = {
    get_layout: () => active_layout,
    create_ui_layout,
    create_info_bar,
    create_cli_bar,
    create_cad_timeline: create_history_tree,
    create_viewport_panel
};
