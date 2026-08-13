import type { game_map } from '@/core/types';
import type { pack_registry } from '@/core/pack_manager';
import { get_device_definition } from '@/core/pack_manager';
import { get_world_cells } from '@/utils/device_utils';
import type { camera_type } from './types';
import { get_device_draw } from './draw_registry';

export function draw_devices
(
    ctx:      CanvasRenderingContext2D,
    map:      game_map,
    registry: pack_registry,
    camera:   camera_type,
    canvas:   HTMLCanvasElement
): void
{
    const { dim_h, dim_v, slices } = camera.plane;

    for (const device of map.devices)
    {
        const def = get_device_definition(registry, device.definition_id);
        if (!def)
        {
            continue;
        }

        const world_cells = get_world_cells(device, def);

        // Keep only cells that lie on the current cross-section.
        // A cell is visible when every non-displayed dimension matches its slice depth.
        const visible_cells = world_cells.filter(cell =>
            cell.every((coord, i) =>
                i === dim_h ||
                i === dim_v ||
                coord === slices[i]
            )
        );

        if (visible_cells.length === 0)
        {
            continue;
        }

        // Compute bounding box in world coordinates (across visible cells).
        const h_coords = visible_cells.map(c => c[dim_h]);
        const v_coords = visible_cells.map(c => c[dim_v]);
        const min_h = Math.min(...h_coords);
        const max_h = Math.max(...h_coords);
        const min_v = Math.min(...v_coords);
        const max_v = Math.max(...v_coords);

        // Convert bounding box to screen coordinates.
        // Each cell at world coord w occupies screen pixels [w*zoom, (w+1)*zoom).
        // Y is flipped: larger v → smaller sy (higher on screen).
        const sx = camera.pan_x + min_h * camera.zoom;
        const sy = canvas.height + camera.pan_y - (max_v + 1) * camera.zoom;
        const sw = (max_h - min_h + 1) * camera.zoom;
        const sh = (max_v - min_v + 1) * camera.zoom;

        // Retrieve and execute the registered device draw function. Every device MUST have one.
        const draw_fn = get_device_draw(device.definition_id);
        if (draw_fn)
        {
            draw_fn(ctx, sx, sy, sw, sh, camera.zoom);
        }
    }
}