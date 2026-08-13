import type { game_map, device, device_definition } from '@/core/types';
import type { pack_registry } from '@/core/pack_manager';
import { get_device_definition } from '@/core/pack_manager';
import { get_world_cells } from '@/utils/device_utils';
import type { camera_type } from './types';
import { get_device_draw } from './draw_registry';

interface render_item
{
    device:        device;
    def:           device_definition;
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
    const { device, def, visible_cells } = item;

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
        draw_fn(ctx, sx, sy, sw, sh, camera.zoom, device, def, camera);
    }
}

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

    const ghost_items: render_item[] = [];
    const active_items: render_item[] = [];

    for (const device of map.devices)
    {
        const def = get_device_definition(registry, device.definition_id);
        if (!def)
        {
            continue;
        }

        const world_cells = get_world_cells(device, def);
        let max_slice_dist = 0;

        // Compute minimum distance from camera slice to the device's cell range for each non-displayed dimension.
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
            else if (slice_val > max_dim)
            {
                dim_dist = slice_val - max_dim;
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
            // Ghost item: adjacent to slice (e.g. slice y=2 for an item occupying [0, 2) i.e. y=0,1).
            // Render entire device footprint as semi-transparent.
            ghost_items.push({ device, def, visible_cells: world_cells });
        }
        else
        {
            // Active item: intersects the slice (max_slice_dist === 0).
            // Filter cells that lie directly on the slice plane.
            const visible_cells = world_cells.filter(cell =>
                cell.every((coord, i) =>
                    i === dim_h ||
                    i === dim_v ||
                    coord === slices[i]
                )
            );

            if (visible_cells.length > 0)
            {
                active_items.push({ device, def, visible_cells });
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