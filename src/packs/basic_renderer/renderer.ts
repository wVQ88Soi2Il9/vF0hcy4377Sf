import type { camera_type } from './types';
import { draw_grid } from './draw_grid';
import { draw_devices } from './draw_device';
import { on_device_change, on_history_change } from '@/core';
import { get_map } from '@/runtime';
import { camera, adapt_camera_plane } from './camera';
import { setup_camera_control } from './camera_control';

let renderer_canvas: HTMLCanvasElement | null = null;
let current_draw_fn: (() => void) | null = null;
let active_draw_devices_fn: typeof draw_devices = draw_devices;
let is_redraw_scheduled = false;

/**
 * Registers a custom device drawing function for the renderer.
 */
export function set_device_drawer(fn: typeof draw_devices): void
{
    active_draw_devices_fn = fn;
    redraw_renderer();
}

/**
 * Returns the Canvas element created by basic_renderer.
 */
export function get_renderer_canvas(): HTMLCanvasElement | null
{
    return renderer_canvas;
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
    const h = pos[cam.plane.dim_h];
    const v = pos[cam.plane.dim_v];

    const sx = cam.pan_x + h * cam.zoom;
    const sy = canvas_height + cam.pan_y - v * cam.zoom;
    return { sx, sy };
}

/**
 * Creates the canvas, sets up camera controls and redraw loop.
 */
export function init_renderer(): void
{
    const map = get_map();

    if (!map)
    {
        console.error('[basic_renderer] init_pack() called before set_map(). Renderer aborted.');
        return;
    }

    adapt_camera_plane(camera, map.dimension);

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

    queueMicrotask(redraw_renderer);
}
