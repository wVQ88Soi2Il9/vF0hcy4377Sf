import { camera } from './camera';

/**
 * Updates camera pan position.
 */
export function set_camera_pan(cam: camera, pan_x: number, pan_y: number): void
{
    cam.pan_x = pan_x;
    cam.pan_y = pan_y;
    cam.notify_change();
}

/**
 * Updates camera zoom factor.
 */
export function set_camera_zoom(cam: camera, zoom: number): void
{
    cam.zoom = Math.max(10, Math.min(200, zoom));
    cam.notify_change();
}

/**
 * Sets full camera transform (pan and zoom).
 */
export function set_camera_transform(cam: camera, pan_x: number, pan_y: number, zoom: number): void
{
    cam.pan_x = pan_x;
    cam.pan_y = pan_y;
    cam.zoom  = Math.max(10, Math.min(200, zoom));
    cam.notify_change();
}

/**
 * Updates the camera view plane and triggers a change notification.
 */
export function set_camera_plane(cam: camera, dim_h: number, dim_v: number, target_dim: number, slices?: number[]): void
{
    if (dim_h >= 0 && dim_h < target_dim)
    {
        cam.plane.dim_h = dim_h;
    }
    if (dim_v >= 0 && dim_v < target_dim && dim_v !== cam.plane.dim_h)
    {
        cam.plane.dim_v = dim_v;
    }

    if (slices && slices.length === target_dim)
    {
        cam.plane.slices = [...slices];
    }
    else
    {
        cam.adapt_plane(target_dim);
    }

    cam.notify_change();
}

/**
 * Swaps horizontal and vertical axes (Clockwise 90-degree view change).
 */
export function rotate_camera_cw(cam: camera): void
{
    const old_h = cam.plane.dim_h;
    const old_v = cam.plane.dim_v;
    cam.plane.dim_h = old_v;
    cam.plane.dim_v = old_h;
    cam.notify_change();
}

/**
 * Swaps vertical and horizontal axes (Counter-Clockwise 90-degree view change).
 */
export function rotate_camera_ccw(cam: camera): void
{
    const old_h = cam.plane.dim_h;
    const old_v = cam.plane.dim_v;
    cam.plane.dim_h = old_v;
    cam.plane.dim_v = old_h;
    cam.notify_change();
}

/**
 * Sets up mouse dragging and wheel zooming event listeners on the canvas.
 * Returns an unbind function.
 */
export function setup_camera_control(canvas: HTMLCanvasElement, cam: camera, redraw: () => void): () => void
{
    let is_dragging = false;
    let drag_start_x = 0;
    let drag_start_y = 0;

    const on_mousedown = (e: MouseEvent) =>
    {
        is_dragging = true;
        drag_start_x = e.clientX - cam.pan_x;
        drag_start_y = e.clientY - cam.pan_y;
    };

    const on_mousemove = (e: MouseEvent) =>
    {
        if (!is_dragging)
        {
            return;
        }
        cam.pan_x = e.clientX - drag_start_x;
        cam.pan_y = e.clientY - drag_start_y;
        cam.notify_change();
        redraw();
    };

    const on_mouseup = () =>
    {
        is_dragging = false;
    };

    const on_wheel = (e: WheelEvent) =>
    {
        e.preventDefault();

        const canvas_h = canvas.height;
        const rect = canvas.getBoundingClientRect();
        const offset_x = e.clientX - rect.left;
        const offset_y = e.clientY - rect.top;

        const mouse_h = (offset_x - cam.pan_x) / cam.zoom;
        const mouse_v = (canvas_h + cam.pan_y - offset_y) / cam.zoom;

        const factor = e.deltaY < 0 ? 1.12 : 0.88;
        cam.zoom = Math.max(10, Math.min(200, cam.zoom * factor));

        cam.pan_x = offset_x - mouse_h * cam.zoom;
        cam.pan_y = offset_y - canvas_h + mouse_v * cam.zoom;

        cam.notify_change();
        redraw();
    };

    canvas.addEventListener('mousedown', on_mousedown);
    window.addEventListener('mousemove', on_mousemove);
    window.addEventListener('mouseup', on_mouseup);
    canvas.addEventListener('wheel', on_wheel, { passive: false });

    return () =>
    {
        canvas.removeEventListener('mousedown', on_mousedown);
        window.removeEventListener('mousemove', on_mousemove);
        window.removeEventListener('mouseup', on_mouseup);
        canvas.removeEventListener('wheel', on_wheel);
    };
}
