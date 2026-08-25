import type { camera_type, view_plane, drawable_device } from './types';
import { draw_grid } from './draw_grid';
import { draw_devices } from './draw_device';
import { on_device_change, on_history_change, type unsubscribe_function } from '@/API';
import { get_map } from '@/runtime';

export type { camera_type, view_plane, drawable_device };

let renderer_canvas: HTMLCanvasElement | null = null;
let current_draw_fn: (() => void) | null = null;
let active_draw_devices_fn: typeof draw_devices = draw_devices;
let is_redraw_scheduled = false;

const camera_listeners = new Set<(cam: camera_type) => void>();

function notify_camera_change(): void
{
    const snapshot = get_camera_state();
    for (const listener of camera_listeners)
    {
        listener(snapshot);
    }
}

/**
 * Registers a custom device drawing function for the renderer.
 */
export function set_device_drawer(fn: typeof draw_devices): void
{
    active_draw_devices_fn = fn;
    redraw_renderer();
}

const camera: camera_type =
{
    pan_x: 0,
    pan_y: 0,
    zoom:  40,
    // dim_h=0 (X→right), dim_v=1 (Y→up), slices dynamically adapt to map.dimension (default Z=1)
    plane: { dim_h: 0, dim_v: 1, slices: [0, 0, 0] }
};

/**
 * Adapts camera plane slices and axes to match the N-dimensional map.
 */
function adapt_camera_plane(cam: camera_type, target_dim: number): void
{
    if (target_dim <= 0)
    {
        return;
    }

    if (cam.plane.dim_h < 0 || cam.plane.dim_h >= target_dim)
    {
        cam.plane.dim_h = 0;
    }
    if (cam.plane.dim_v < 0 || cam.plane.dim_v >= target_dim || cam.plane.dim_v === cam.plane.dim_h)
    {
        cam.plane.dim_v = target_dim > 1 ? (cam.plane.dim_h === 0 ? 1 : 0) : 0;
    }

    const current_slices = cam.plane.slices || [];
    const new_slices = new Array(target_dim).fill(0);
    for (let i = 0; i < target_dim; i++)
    {
        if (i < current_slices.length && typeof current_slices[i] === 'number')
        {
            new_slices[i] = current_slices[i];
        }
    }
    cam.plane.slices = new_slices;
}

/**
 * Returns the Canvas element created by basic_renderer.
 */
export function get_renderer_canvas(): HTMLCanvasElement | null
{
    return renderer_canvas;
}

/**
 * Returns a shallow copy of the current camera view plane.
 */
export function get_camera_plane(): view_plane
{
    const map = get_map();
    if (map)
    {
        adapt_camera_plane(camera, map.dimension);
    }
    return {
        dim_h:  camera.plane.dim_h,
        dim_v:  camera.plane.dim_v,
        slices: [...camera.plane.slices]
    };
}

/**
 * Returns a snapshot of the current camera state.
 */
export function get_camera_state(): camera_type
{
    const map = get_map();
    if (map)
    {
        adapt_camera_plane(camera, map.dimension);
    }
    return {
        pan_x: camera.pan_x,
        pan_y: camera.pan_y,
        zoom:  camera.zoom,
        plane: {
            dim_h:  camera.plane.dim_h,
            dim_v:  camera.plane.dim_v,
            slices: [...camera.plane.slices]
        }
    };
}

/**
 * Subscribes to camera pan/zoom/plane state changes.
 */
export function on_camera_change(listener: (cam: camera_type) => void): unsubscribe_function
{
    camera_listeners.add(listener);
    return () =>
    {
        camera_listeners.delete(listener);
    };
}

/**
 * Updates camera pan position.
 */
export function set_camera_pan(pan_x: number, pan_y: number): void
{
    camera.pan_x = pan_x;
    camera.pan_y = pan_y;
    notify_camera_change();
    redraw_renderer();
}

/**
 * Updates camera zoom factor.
 */
export function set_camera_zoom(zoom: number): void
{
    camera.zoom = Math.max(10, Math.min(200, zoom));
    notify_camera_change();
    redraw_renderer();
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
    redraw_renderer();
}

/**
 * Updates the camera view plane and triggers a redraw.
 */
export function set_camera_plane(dim_h: number, dim_v: number, slices?: number[]): void
{
    const map = get_map();
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
    redraw_renderer();
}

/**
 * Resizes the renderer canvas to the specified dimensions and triggers a redraw.
 */
export function resize_renderer_canvas(width: number, height: number): void
{
    if (!renderer_canvas || width <= 0 || height <= 0)
    {
        return;
    }

    if (renderer_canvas.width === width && renderer_canvas.height === height)
    {
        return;
    }

    renderer_canvas.width = width;
    renderer_canvas.height = height;

    // Redraw immediately to avoid blank buffer flash between resize and next rAF
    if (current_draw_fn)
    {
        current_draw_fn();
    }
}

/**
 * Triggers a debounced redraw of the renderer via requestAnimationFrame.
 */
export function redraw_renderer(): void
{
    if (is_redraw_scheduled)
    {
        return;
    }
    is_redraw_scheduled = true;
    requestAnimationFrame(() =>
    {
        is_redraw_scheduled = false;
        if (current_draw_fn)
        {
            current_draw_fn();
        }
    });
}

/**
 * Maps an N-dimensional world grid position to a 2-D canvas position.
 */
export function grid_to_screen
(
    pos:           number[],
    cam:           camera_type,
    canvas_height: number = (renderer_canvas ? renderer_canvas.height : window.innerHeight)
)
{
    const h = pos[cam.plane.dim_h];  // world → screen X
    const v = pos[cam.plane.dim_v];  // world → screen Y (will be flipped)

    const sx = cam.pan_x + h * cam.zoom;
    const sy = canvas_height + cam.pan_y - v * cam.zoom;
    return { sx, sy };
}

function setup_camera_control(canvas: HTMLCanvasElement, redraw: () => void): void
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

/**
 * Standard pack entry point.
 * Creates the canvas, sets up camera controls and redraw loop.
 */
export function init_pack(): void
{
    const map = get_map();

    if (!map)
    {
        console.error('[basic_renderer] init_pack() called before set_map(). Renderer aborted.');
        return;
    }

    adapt_camera_plane(camera, map.dimension);

    // Build canvas without attaching it to DOM directly (managed by UI pack).
    renderer_canvas = document.createElement('canvas');
    renderer_canvas.id = 'renderer_canvas';
    renderer_canvas.width  = window.innerWidth;
    renderer_canvas.height = window.innerHeight;
    renderer_canvas.style.cssText = 'display:block;width:100%;height:100%;';

    const ctx = renderer_canvas.getContext('2d')!;

    function draw(): void
    {
        if (!renderer_canvas || !map)
        {
            return;
        }
        adapt_camera_plane(camera, map.dimension);
        ctx.clearRect(0, 0, renderer_canvas.width, renderer_canvas.height);
        draw_grid(ctx, renderer_canvas, camera, map);
        active_draw_devices_fn(ctx, map, camera, renderer_canvas);
    }

    current_draw_fn = draw;

    setup_camera_control(renderer_canvas, redraw_renderer);
    on_device_change(redraw_renderer);
    on_history_change(redraw_renderer);

    // Initial render — wait one microtask so other packs' init_pack() can finish first.
    queueMicrotask(redraw_renderer);
}

import type { pack_module } from '@/API';

/**
 * Unified Object Export for basic_renderer pack API.
 */
export const basic_renderer: pack_module = {
    pack_id:                   'basic_renderer',
    // Canvas & Redraw
    get_canvas:           get_renderer_canvas,
    resize_canvas:        resize_renderer_canvas,
    redraw:               redraw_renderer,
    set_device_drawer:    set_device_drawer,

    // Camera & Viewport
    get_camera:           get_camera_plane,
    get_camera_state:     get_camera_state,
    set_camera:           set_camera_plane,
    set_camera_pan:       set_camera_pan,
    set_camera_zoom:      set_camera_zoom,
    set_camera_transform: set_camera_transform,
    on_camera_change:     on_camera_change,
    grid_to_screen:       grid_to_screen
};