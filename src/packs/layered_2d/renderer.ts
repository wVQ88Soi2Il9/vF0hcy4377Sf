import type { game_map, device } from '@/API';
import type { camera_type, drawable_device } from '@/packs/basic_renderer';
import { add_vector_3d } from './math';
import type { vector_3d, layered_render_options } from './types';

interface render_item
{
    device:        device;
    layer:         number;
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
 * 2.5D 分層透視渲染函式。
 * 依照高程 Z 軸由低至高（Z 升序）分層渲染：
 * 1. 僅顯示與 [active_layer, active_layer + 3) 相交的可見層級。
 * 2. 焦點層以正常不透明度繪製。
 * 3. 疊加層（透視）以半透明 Alpha 繪製。
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
    const inactive_alpha = options.inactive_alpha ?? 0.35;

    if (is_xy_plane)
    {
        // 收集所有在水平視圖中可見的格點與所屬層級（必須與 [active_layer, active_layer + 3) 相交）
        const items_by_layer = new Map<number, render_item[]>();

        for (const device of map.devices)
        {
            const pos = device.position as vector_3d;
            const local_cells = device.get_shape() as vector_3d[];
            const world_cells = local_cells.map(c => add_vector_3d(pos, c));

            // 依 Z 軸層級分組，並過濾落在 [active_layer, active_layer + 3) 範圍內的格點
            const layer_groups = new Map<number, vector_3d[]>();
            for (const cell of world_cells)
            {
                const z_layer = cell[2];
                if (z_layer < active_layer + 3 && z_layer + 2 > active_layer)
                {
                    const list = layer_groups.get(z_layer) || [];
                    list.push(cell);
                    layer_groups.set(z_layer, list);
                }
            }

            for (const [layer, cells] of layer_groups.entries())
            {
                const list = items_by_layer.get(layer) || [];
                list.push({ device, layer, visible_cells: cells });
                items_by_layer.set(layer, list);
            }
        }

        // 取得所有存在的層級，並依照 Z 由小到大排序（由底層向高層繪製）
        const sorted_layers = Array.from(items_by_layer.keys()).sort((a, b) => a - b);

        for (const layer of sorted_layers)
        {
            const items = items_by_layer.get(layer) || [];
            const is_focus_layer = layer === active_layer || (layer >= active_layer && layer < active_layer + 2);

            if (is_focus_layer)
            {
                // 焦點層：以正常不透明度繪製
                for (const item of items)
                {
                    render_device_item(ctx, item, camera, canvas);
                }
            }
            else if (show_inactive)
            {
                // 透視層：以半透明 Alpha 疊加繪製
                ctx.save();
                ctx.globalAlpha = inactive_alpha;
                for (const item of items)
                {
                    render_device_item(ctx, item, camera, canvas);
                }
                ctx.restore();
            }
        }
    }
    else
    {
        // 非 XY 平面時退化為標準單一切片
        for (const device of map.devices)
        {
            const world_cells = device.get_shape().map(pos => add_vector_3d(device.position as vector_3d, pos as vector_3d));
            const visible_cells = world_cells.filter(cell =>
                cell.every((coord, i) =>
                    i === dim_h ||
                    i === dim_v ||
                    (coord < slices[i] + 3 && coord + 2 > slices[i])
                )
            );

            if (visible_cells.length > 0)
            {
                render_device_item(ctx, { device, layer: 0, visible_cells }, camera, canvas);
            }
        }
    }
}
