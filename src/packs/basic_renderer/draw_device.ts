import type { space, device } from '@/core';
import type { camera_type, drawable_device } from './types';
import { add_vector } from '@/packs/vanilla';

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
    map:      space,
    camera:   camera_type,
    canvas:   HTMLCanvasElement
): void
{
    const { dim_h, dim_v, slices } = camera.plane;

    for (const device of map.devices)
    {
        const world_cells = device.get_shape().map(pos => add_vector(device.position, pos));

        // Filter cells that intersect the current slice window [slices[i], slices[i] + 3) along non-displayed dimensions
        const visible_cells = world_cells.filter(cell =>
            cell.every((coord, i) =>
                i === dim_h ||
                i === dim_v ||
                (coord < slices[i] + 3 && coord + 2 > slices[i])
            )
        );

        if (visible_cells.length > 0)
        {
            render_device_item(ctx, { device, visible_cells }, camera, canvas);
        }
    }
}
