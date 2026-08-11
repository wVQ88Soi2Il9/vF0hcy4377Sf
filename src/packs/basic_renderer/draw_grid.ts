import grid_svg_url from './assets/grid.svg'   // Vite 幫你轉成 URL
import type { cameratype } from './types'

const SVG_SIZE = 128   // 你的 SVG 是 128×128

// 圖片只載入一次（模組層級）
const grid_img = new Image()
grid_img.src = grid_svg_url

export function draw_grid
(
    ctx: CanvasRenderingContext2D,    
    canvas: HTMLCanvasElement,    
    camera: cameratype
): void
{
    if (!grid_img.complete) return  // 還沒載入完就跳過

    const pattern = ctx.createPattern(grid_img, 'repeat')!

    // 讓 pattern 跟著 camera 移動和縮放
    pattern.setTransform(new DOMMatrix()
        .translate(camera.pan_x, camera.pan_y)
        .scale(camera.zoom / SVG_SIZE)
    )

    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}