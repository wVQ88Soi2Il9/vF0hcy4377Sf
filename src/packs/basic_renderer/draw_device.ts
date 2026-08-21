import type { game_map, device, device_definition } from '@/core/types';
import type { pack_registry } from '@/core/pack_manager';
import { get_device_definition } from '@/core/pack_manager';
import { trigger_check_overlap } from '@/API';
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
    ctx:           CanvasRenderingContext2D,
    item:          render_item,
    camera:        camera_type,
    canvas:        HTMLCanvasElement,
    is_overlapped: boolean
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
    // Each cell anchor [x, y, z] occupies a 2x2x2 block [x, x+2) * [y, y+2) * [z, z+2).
    // Y is flipped: larger v → smaller sy (higher on screen).
    const sx = camera.pan_x + min_h * camera.zoom;
    const sy = canvas.height + camera.pan_y - (max_v + 2) * camera.zoom;
    const sw = (max_h - min_h + 2) * camera.zoom;
    const sh = (max_v - min_v + 2) * camera.zoom;

    // Retrieve and execute the registered device draw function. Every device MUST have one.
    const draw_fn = get_device_draw(device.definition_id);
    if (draw_fn)
    {
        draw_fn(ctx, sx, sy, sw, sh, camera.zoom, device, def, camera);
    }

    // 若發生重疊，以淡紅色包覆（外框同樣內縮於 grid 內部）
    if (is_overlapped)
    {
        ctx.fillStyle = 'rgba(248, 113, 113, 0.45)';
        ctx.fillRect(sx, sy, sw, sh);

        const red_lw = Math.max(2, camera.zoom * 0.05);
        const half_red_lw = red_lw / 2;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = red_lw;
        ctx.strokeRect(sx + half_red_lw, sy + half_red_lw, sw - red_lw, sh - red_lw);
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

    const overlap_results = trigger_check_overlap(map, registry) as Array<{ overlapped?: number[] }>;
    const overlapped_uids = new Set<number>();
    for (const res of overlap_results)
    {
        if (res && Array.isArray(res.overlapped))
        {
            for (const uid of res.overlapped)
            {
                overlapped_uids.add(uid);
            }
        }
    }

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

        if (max_slice_dist === 0)
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
                active_items.push({ device, def, visible_cells });
            }
        }
    }

    // Render active items (current slice, distance = 0)
    for (const item of active_items)
    {
        render_device_item(ctx, item, camera, canvas, overlapped_uids.has(item.device.uid));
    }
}
