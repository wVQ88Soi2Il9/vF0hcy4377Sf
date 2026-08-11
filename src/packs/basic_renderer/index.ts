import type { cameratype } from "./types"
import { draw_grid } from "./draw_grid"
import { draw_devices } from "./draw_device"
import { game_map, pack_registry } from "@/core"

const camera: cameratype = 
{
    pan_x: 0,
    pan_y: 0,
    zoom:  40,
    plane: { axis: 'z', depth: 0 }
}

/**
 * Maps a 3-D world grid position to a 2-D canvas position.
 *
 * Coordinate convention (right-hand, Y-up):
 *   axis='z'  →  h=x (right), v=y (up, flipped)
 *   axis='x'  →  h=y (right), v=z (up, flipped)
 *   axis='y'  →  h=x (right), v=z (up, flipped)
 *
 * The vertical axis is negated so that positive values go upward on screen.
 * The canvas origin (pan_x, pan_y) corresponds to world origin of the plane.
 */
export function grid_to_screen
(
    wx: number,
    wy: number,
    wz: number,
    camera: cameratype
)
{
    let h: number  // world coordinate that maps to screen X (right)
    let v: number  // world coordinate that maps to screen Y (negated, so up = positive)

    if (camera.plane.axis === 'z')       { h = wx; v = wy }
    else if (camera.plane.axis === 'x')  { h = wy; v = wz }
    else                                 { h = wx; v = wz }  // axis === 'y'

    // Flip v: in Canvas Y increases downward, but we want Y/Z to increase upward.
    const sx = camera.pan_x + h * camera.zoom
    const sy = camera.pan_y - v * camera.zoom
    return { sx, sy }
}

function camera_control(canvas: HTMLCanvasElement): void
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
    }, { passive: false })
}



export function init
(
    canvas: HTMLCanvasElement,
    map: game_map, 
    registry: pack_registry
): void
{

    const ctx = canvas.getContext('2d')!
    camera_control(canvas);
    
    function loop(): void
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw_grid(ctx, canvas, camera)
        draw_devices(ctx, map, registry, camera)
        requestAnimationFrame(loop);
    }

    loop();
}