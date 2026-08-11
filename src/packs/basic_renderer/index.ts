import type { cameratype } from "./types"
import type { vector } from "@/core/types"
import { draw_grid } from "./draw_grid"
import { draw_devices } from "./draw_device"
import { game_map, pack_registry } from "@/core"
import { on_device_change } from "@/API"

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
    pos:    vector,
    camera: cameratype
)
{
    const h = pos[camera.plane.dim_h] ?? 0  // world → screen X
    const v = pos[camera.plane.dim_v] ?? 0  // world → screen Y (will be flipped)

    // Flip v: Canvas Y increases downward, but we want positive values to go upward.
    const sx = camera.pan_x + h * camera.zoom
    const sy = camera.pan_y - v * camera.zoom
    return { sx, sy }
}

function camera_control(canvas: HTMLCanvasElement, redraw: () => void): void
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

    canvas.addEventListener('wheel', (e) =>
    {
        e.preventDefault()

        // Compute mouse position in world-horizontal/world-vertical units before zoom.
        // sx = pan_x + h * zoom  →  h = (offsetX - pan_x) / zoom
        // sy = pan_y - v * zoom  →  v = (pan_y - offsetY) / zoom  (Y is flipped)
        const mouse_h = (e.offsetX - camera.pan_x) / camera.zoom
        const mouse_v = (camera.pan_y - e.offsetY) / camera.zoom

        // Adjust zoom.
        const factor = e.deltaY < 0 ? 1.1 : 0.9
        camera.zoom = Math.max(10, Math.min(200, camera.zoom * factor))

        // Keep the world point under the mouse cursor fixed.
        camera.pan_x = e.offsetX - mouse_h * camera.zoom
        camera.pan_y = e.offsetY + mouse_v * camera.zoom
        
        redraw()
    }, { passive: false })
}



export function init
(
    canvas:   HTMLCanvasElement,
    map:      game_map, 
    registry: pack_registry
): void
{
    const ctx = canvas.getContext('2d')!
    
    function draw(): void
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw_grid(ctx, canvas, camera)
        draw_devices(ctx, map, registry, camera)
    }

    camera_control(canvas, draw);
    on_device_change(draw);

    draw();
}