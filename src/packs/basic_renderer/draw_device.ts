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

        // Keep cells that lie within slice distance <= 1 on all non-displayed axes.
        let max_dist = 0;
        const visible_cells: number[][] = [];

        for (const cell of world_cells)
        {
            let is_cell_valid = true;
            let cell_max_dist = 0;

            for (let i = 0; i < cell.length; i++)
            {
                if (i === dim_h || i === dim_v)
                {
                    continue;
                }
                const dist = Math.abs(cell[i] - slices[i]);
                if (dist > 1)
                {
                    is_cell_valid = false;
                    break;
                }
                if (dist > cell_max_dist)
                {
                    cell_max_dist = dist;
                }
            }

            if (is_cell_valid)
            {
                visible_cells.push(cell);
                if (cell_max_dist > max_dist)
                {
                    max_dist = cell_max_dist;
                }
            }
        }

        if (visible_cells.length === 0)
        {
            continue;
        }

        const item: render_item = { device, def, visible_cells };
        if (max_dist === 1)
        {
            ghost_items.push(item);
        }
        else
        {
            active_items.push(item);
        }
    }

    // Pass 1: Render ghost items (adjacent slice, max_dist = 1) with translucent alpha
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

    // Pass 2: Render active items (current slice, max_dist = 0) with full opacity
    for (const item of active_items)
    {
        render_device_item(ctx, item, camera, canvas);
    }
}