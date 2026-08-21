import type { game_map, device } from '@/API';
import type { camera_type, drawable_device } from '@/packs/basic_renderer';
import { add_vector_3d } from './math';
import type { vector_3d, layered_render_options } from './types';

interface render_item
{
    device:        device;
    visible_cells: vector_3d[];
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

    const h_coords = visible_cells.map(c => c[dim_h]);
    const v_coords = visible_cells.map(c => c[dim_v]);
    const min_h = Math.min(...h_coords);
    const max_h = Math.max(...h_coords);
    const min_v = Math.min(...v_coords);
    const max_v = Math.max(...v_coords);

    const sx = camera.pan_x + min_h * camera.zoom;
    const sy = canvas.height + camera.pan_y - (max_v + 2) * camera.zoom;
    const sw = (max_h - min_h + 2) * camera.zoom;
    const sh = (max_v - min_v + 2) * camera.zoom;

    (device as drawable_device).draw(ctx, sx, sy, sw, sh, camera.zoom, camera);
}

/**
 * 2.5D Two-Pass 分層透視渲染函式。
 * 在焦點層呈現正常不透明度的同時，將非焦點高程層（如 Z=2 高架層）以半透明 Alpha 繪製在背景。
 */
export function draw_layered_devices
(
    ctx:      CanvasRenderingContext2D,
    map:      game_map,
    camera:   camera_type,
    canvas:   HTMLCanvasElement,
    options:  layered_render_options = {}
): void
{
    const { dim_h, dim_v, slices } = camera.plane;
    const is_xy_plane = dim_h === 0 && dim_v === 1;

    const active_layer = options.active_layer ?? (slices.length > 2 ? slices[2] : 0);
    const show_inactive = options.show_inactive_layers !== false;
    const inactive_alpha = options.inactive_alpha ?? 0.25;

    const active_items: render_item[] = [];
    const inactive_items: render_item[] = [];

    for (const device of map.devices)
    {
        const pos = device.position as vector_3d;
        const local_cells = device.get_shape() as vector_3d[];
        const world_cells = local_cells.map(c => add_vector_3d(pos, c));

        if (is_xy_plane)
        {
            // 2.5D 水平分層邏輯
            const active_cells = world_cells.filter(c => c[2] >= active_layer && c[2] < active_layer + 2);
            const inactive_cells = world_cells.filter(c => c[2] < active_layer || c[2] >= active_layer + 2);

            if (active_cells.length > 0)
            {
                active_items.push({ device, visible_cells: active_cells });
            }
            if (inactive_cells.length > 0)
            {
                inactive_items.push({ device, visible_cells: inactive_cells });
            }
        }
        else
        {
            // 非 XY 平面時退化為標準切片
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

    // Pass 1: 繪製非焦點層的半透明投影
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

    // Pass 2: 繪製焦點層清晰裝置
    for (const item of active_items)
    {
        render_device_item(ctx, item, camera, canvas);
    }
}
