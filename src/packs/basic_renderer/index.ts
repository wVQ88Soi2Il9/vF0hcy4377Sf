import type { cameratype } from './types'
import { draw_grid } from './draw_grid'
import { draw_devices } from './draw_device'
import { on_device_change } from '@/API'
import { get_map, get_registry } from '@/runtime'

const camera: cameratype =
{
    pan_x: 0,
    pan_y: 0,
    zoom:  40,
    // dim_h=0 (X→right), dim_v=1 (Y→up), slices[2]=0 (view z=0 layer)
    plane: { dim_h: 0, dim_v: 1, slices: [0, 0, 0] }
}

/**
 * Maps an N-dimensional world grid position to a 2-D canvas position.
 *
 * The two displayed dimensions are determined by camera.plane.dim_h and dim_v.
 * All other dimensions are ignored (they were already filtered by the caller).
 *
 * The vertical axis is negated so that positive values go upward on screen.
 * The canvas origin (pan_x, pan_y) corresponds to world coordinate [0, 0, ...].
 */
export function grid_to_screen
(
    pos:           number[],
    cam:           cameratype,
    canvas_height: number = window.innerHeight
)
{
    const h = pos[cam.plane.dim_h] ?? 0  // world → screen X
    const v = pos[cam.plane.dim_v] ?? 0  // world → screen Y (will be flipped)

    // Flip v: Canvas Y increases downward, but we want positive values to go upward.
    // The canvas origin (pan_x, canvas_height + pan_y) corresponds to world coordinate [0, 0, ...].
    const sx = cam.pan_x + h * cam.zoom
    const sy = canvas_height + cam.pan_y - v * cam.zoom
    return { sx, sy }
}

function setup_camera_control(canvas: HTMLCanvasElement, redraw: () => void): void
{
    let is_dragging = false
    let drag_start_x = 0
    let drag_start_y = 0

    canvas.addEventListener('mousedown', (e) =>
    {
        is_dragging = true
        drag_start_x = e.clientX - camera.pan_x
        drag_start_y = e.clientY - camera.pan_y
    })

    canvas.addEventListener('mousemove', (e) =>
    {
        if (!is_dragging) return
        camera.pan_x = e.clientX - drag_start_x
        camera.pan_y = e.clientY - drag_start_y
        redraw()
    })

    canvas.addEventListener('mouseup', () =>
    {
        is_dragging = false
    })

    canvas.addEventListener('mouseleave', () =>
    {
        is_dragging = false
    })

    canvas.addEventListener('wheel', (e) =>
    {
        e.preventDefault()

        // Compute mouse position in world-horizontal/world-vertical units before zoom.
        // sx = pan_x + h * zoom  →  h = (offsetX - pan_x) / zoom
        // sy = canvas.height + pan_y - v * zoom  →  v = (canvas.height + pan_y - offsetY) / zoom  (Y is flipped)
        const mouse_h = (e.offsetX - camera.pan_x) / camera.zoom
        const mouse_v = (canvas.height + camera.pan_y - e.offsetY) / camera.zoom

        // Adjust zoom.
        const factor = e.deltaY < 0 ? 1.1 : 0.9
        camera.zoom = Math.max(10, Math.min(200, camera.zoom * factor))

        // Keep the world point under the mouse cursor fixed.
        camera.pan_x = e.offsetX - mouse_h * camera.zoom
        camera.pan_y = e.offsetY - canvas.height + mouse_v * camera.zoom

        redraw()
    }, { passive: false })
}

/**
 * Standard pack entry point.
 * Creates the canvas, attaches it to #app, sets up camera controls and redraw loop.
 * Reads game_map and pack_registry from API (set by main.ts before calling init_pack).
 */
export function init_pack(): void
{
    const map      = get_map()
    const registry = get_registry()

    if (!map || !registry)
    {
        console.error('[basic_renderer] init_pack() called before set_map() / set_registry(). Renderer aborted.')
        return
    }

    // Build and attach canvas to the host element.
    const canvas = document.createElement('canvas')
    canvas.id = 'renderer_canvas'
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.cssText = 'display:block;position:fixed;inset:0;'

    const host = document.getElementById('app') ?? document.body
    host.appendChild(canvas)

    // Keep canvas size in sync with window.
    window.addEventListener('resize', () =>
    {
        canvas.width  = window.innerWidth
        canvas.height = window.innerHeight
        draw()
    })

    const ctx = canvas.getContext('2d')!

    function draw(): void
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        draw_grid(ctx, canvas, camera)
        draw_devices(ctx, map!, registry!, camera, canvas)
    }

    setup_camera_control(canvas, draw)
    on_device_change(draw)

    // Initial render — wait one microtask so other packs' init_pack() can finish first.
    queueMicrotask(draw)
}