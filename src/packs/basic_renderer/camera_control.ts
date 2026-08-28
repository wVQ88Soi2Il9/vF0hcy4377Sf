import { camera, notify_camera_change, adapt_camera_plane } from './camera';
import { get_space } from '@/world';

/**
 * Updates camera pan position.
 */
export function set_camera_pan(pan_x: number, pan_y: number): void
{
    camera.pan_x = pan_x;
    camera.pan_y = pan_y;
    notify_camera_change();
}

/**
 * Updates camera zoom factor.
 */
export function set_camera_zoom(zoom: number): void
{
    camera.zoom = Math.max(10, Math.min(200, zoom));
    notify_camera_change();
}

/**
 * Sets full camera transform (pan and zoom).
 */
export function set_camera_transform(pan_x: number, pan_y: number, zoom: number): void
{
    camera.pan_x = pan_x;
    camera.pan_y = pan_y;
    camera.zoom  = Math.max(10, Math.min(200, zoom));
    notify_camera_change();
}

/**
 * Updates the camera view plane and triggers a redraw.
 */
export function set_camera_plane(dim_h: number, dim_v: number, slices?: number[]): void
{
    const map = get_space();
    const slice_count = slices ? slices.length : 0;
    const target_dim = map ? map.dimension : Math.max(3, dim_h + 1, dim_v + 1, slice_count);

    if (dim_h >= 0 && dim_h < target_dim)
    {
        camera.plane.dim_h = dim_h;
    }
    if (dim_v >= 0 && dim_v < target_dim && dim_v !== camera.plane.dim_h)
    {
        camera.plane.dim_v = dim_v;
    }

    if (slices)
    {
        const new_slices = new Array(target_dim).fill(0);
        for (let i = 0; i < target_dim; i++)
        {
            if (i < slices.length && typeof slices[i] === 'number')
            {
                new_slices[i] = slices[i];
            }
        }
        camera.plane.slices = new_slices;
    }
    else
    {
        adapt_camera_plane(camera, target_dim);
    }

    notify_camera_change();
}

/**
 * Sets up mouse dragging and wheel zooming event listeners on the canvas.
 */
export function setup_camera_control(canvas: HTMLCanvasElement, redraw: () => void): void
{
    let is_dragging = false;
    let drag_start_x = 0;
    let drag_start_y = 0;

    canvas.addEventListener('mousedown', (e) =>
    {
        is_dragging = true;
        drag_start_x = e.clientX - camera.pan_x;
        drag_start_y = e.clientY - camera.pan_y;
    });

    window.addEventListener('mousemove', (e) =>
    {
        if (!is_dragging)
        {
            return;
        }
        camera.pan_x = e.clientX - drag_start_x;
        camera.pan_y = e.clientY - drag_start_y;
        notify_camera_change();
        redraw();
    });

    window.addEventListener('mouseup', () =>
    {
        is_dragging = false;
    });

    canvas.addEventListener('wheel', (e) =>
    {
        e.preventDefault();

        const canvas_h = canvas.height;
        const rect = canvas.getBoundingClientRect();
        const offset_x = e.clientX - rect.left;
        const offset_y = e.clientY - rect.top;

        const mouse_h = (offset_x - camera.pan_x) / camera.zoom;
        const mouse_v = (canvas_h + camera.pan_y - offset_y) / camera.zoom;

        const factor = e.deltaY < 0 ? 1.12 : 0.88;
        camera.zoom = Math.max(10, Math.min(200, camera.zoom * factor));

        camera.pan_x = offset_x - mouse_h * camera.zoom;
        camera.pan_y = offset_y - canvas_h + mouse_v * camera.zoom;

        notify_camera_change();
        redraw();
    }, { passive: false });
}
