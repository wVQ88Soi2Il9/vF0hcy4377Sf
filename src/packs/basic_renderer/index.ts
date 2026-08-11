import { cameratype } from "./types"
import { draw_grid } from "./draw_grid"
import { draw_devices } from "./draw_device"
import { game_map, pack_registry } from "@/core"

const camera: cameratype = 
{
    pan_x: 0,
    pan_y: 0,
    zoom:  40
}

export function grid_to_screen(gx: number, gy: number, camera: cameratype)
{
    return { sx: camera.pan_x + gx * camera.zoom, sy: camera.pan_y + gy * camera.zoom }
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

        // 滑鼠在哪個格子位置（縮放前）
        const mouse_gx = (e.offsetX - camera.pan_x) / camera.zoom
        const mouse_gy = (e.offsetY - camera.pan_y) / camera.zoom

        // 調整 zoom
        const factor = e.deltaY < 0 ? 1.1 : 0.9
        camera.zoom = Math.max(10, Math.min(200, camera.zoom * factor))

        // 讓滑鼠指向的格子位置不變（縮放錨點）
        camera.pan_x = e.offsetX - mouse_gx * camera.zoom
        camera.pan_y = e.offsetY - mouse_gy * camera.zoom
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