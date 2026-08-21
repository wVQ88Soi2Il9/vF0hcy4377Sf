import type { game_map, device } from '@/API';
import type { camera_type, drawable_device } from './types';
import { add_vector } from '@/utils/math';

interface render_item
{
    device:        device;
    visible_cells: number[][];
}

function render_device_item
(
    ctx:      CanvasRenderingContext2D,
    item:     render_item,
    camera:   camera_type,
    canvas:   HTMLCanvasElement
): void
{
    const { dim_h, dim_v } = camera.plane;
    const { device, visible_cells } = item;

    // Compute bounding box in world coordinates (across visible cells).
    const h_coords = visible_cells.map(c => c[dim_h]);
    const v_coords = visible_cells.map(c => c[dim_v]);
    const min_h = Math.min(...h_coords);
    const max_h = Math.max(...h_coords);
    const min_v = Math.min(...v_coords);
    const max_v = Math.max(...v_coords);

    // Convert bounding box to screen coordinates.
    // Each cell anchor [x, y, z] occupies a 2x2x2 block [x, x+2) * [y, y+2) * [z, z+2).
    // Y is flipped: larger v → smaller sy (higher on screen).
    const sx = camera.pan_x + min_h * camera.zoom;
    const sy = canvas.height + camera.pan_y - (max_v + 2) * camera.zoom;
    const sw = (max_h - min_h + 2) * camera.zoom;
    const sh = (max_v - min_v + 2) * camera.zoom;

    // Directly call the device's polymorphic draw method.
    (device as drawable_device).draw(ctx, sx, sy, sw, sh, camera.zoom, camera);
}

export function draw_devices
(
    ctx:      CanvasRenderingContext2D,
    map:      game_map,
    camera:   camera_type,
    canvas:   HTMLCanvasElement
): void
{
    const { dim_h, dim_v, slices } = camera.plane;
    const show_inactive = camera.show_inactive_layers !== false;
    const inactive_alpha = camera.inactive_alpha ?? 0.25;

    const active_items: render_item[] = [];
    const inactive_items: render_item[] = [];

    for (const device of map.devices)
    {
        const world_cells = device.get_shape().map(pos => add_vector(device.position, pos));

        // Separate cells into active slice cells vs non-active slice cells
        const active_cells: number[][] = [];
        const inactive_cells: number[][] = [];

        for (const cell of world_cells)
        {
            const is_on_slice = cell.every((coord, i) =>
                i === dim_h ||
                i === dim_v ||
                (slices[i] >= coord && slices[i] < coord + 2)
            );

            if (is_on_slice)
            {
                active_cells.push(cell);
            }
            else
            {
                inactive_cells.push(cell);
            }
        }

        if (active_cells.length > 0)
        {
            active_items.push({ device, visible_cells: active_cells });
        }
        if (inactive_cells.length > 0)
        {
            inactive_items.push({ device, visible_cells: inactive_cells });
        }
    }

    // Pass 1: Render inactive layers/slices with alpha transparency in background
    if (show_inactive && inactive_items.length > 0)
    {
        ctx.save();
        ctx.globalAlpha = inactive_alpha;
        for (const item of inactive_items)
        {
            render_device_item(ctx, item, camera, canvas);
        }
        ctx.restore();
    }

    // Pass 2: Render active layer/slice devices in foreground with full opacity
    for (const item of active_items)
    {
        render_device_item(ctx, item, camera, canvas);
    }
}
