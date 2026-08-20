import type { game_map, device } from '@/core/types';
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

    const ghost_items: render_item[] = [];
    const active_items: render_item[] = [];

    for (const device of map.devices)
    {
        const world_cells = device.get_shape().map(pos => add_vector(device.position, pos));
        let max_slice_dist = 0;

        // Compute minimum distance from camera slice to the device's 2x2x2 cell range for each non-displayed dimension.
        for (let i = 0; i < slices.length; i++)
        {
            if (i === dim_h || i === dim_v)
            {
                continue;
            }

            const dim_coords = world_cells.map(cell => cell[i]);
            const min_dim = Math.min(...dim_coords);
            const max_dim = Math.max(...dim_coords);
            const slice_val = slices[i];

            let dim_dist = 0;
            if (slice_val < min_dim)
            {
                dim_dist = min_dim - slice_val;
            }
            else if (slice_val >= max_dim + 2)
            {
                dim_dist = slice_val - (max_dim + 2) + 1;
            }

            if (dim_dist > max_slice_dist)
            {
                max_slice_dist = dim_dist;
            }
        }

        if (max_slice_dist > 1)
        {
            continue;
        }

        if (max_slice_dist === 1)
        {
            // Ghost item: adjacent to slice (e.g. 1 unit away from [min_dim, max_dim + 2)).
            // Render entire device footprint as semi-transparent.
            ghost_items.push({ device, visible_cells: world_cells });
        }
        else
        {
            // Active item: intersects the slice (max_slice_dist === 0).
            // Filter cells that intersect the slice plane along non-displayed dimensions.
            const visible_cells = world_cells.filter(cell =>
                cell.every((coord, i) =>
                    i === dim_h ||
                    i === dim_v ||
                    (slices[i] >= coord && slices[i] < coord + 2)
                )
            );

            if (visible_cells.length > 0)
            {
                active_items.push({ device, visible_cells });
            }
        }
    }

    // Pass 1: Render ghost items (adjacent slice, distance = 1) with translucent alpha
    if (ghost_items.length > 0)
    {
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (const item of ghost_items)
        {
            render_device_item(ctx, item, camera, canvas);
        }
        ctx.restore();
    }

    // Pass 2: Render active items (current slice, distance = 0) with full opacity
    for (const item of active_items)
    {
        render_device_item(ctx, item, camera, canvas);
    }
}
