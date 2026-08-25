import type { game_map } from '@/core';
import type { camera_type } from './types';

const GRID_STEP = 2;   // 每個網格區塊跨度為 2 單位

/**
 * Renders the viewport background grid matching another_grid.svg (#333333 with #b0b0b0 grid lines)
 * using procedural vector rendering to eliminate scaling distortion, subpixel aliasing, and moiré artifacts at any zoom level.
 */
export function draw_grid
(
    ctx:    CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    camera: camera_type,
    map:    game_map
): void
{
    const w = canvas.width;
    const h = canvas.height;
    const zoom = camera.zoom;

    // 1. 填滿背景底色 (another_grid.svg: #333333)
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, w, h);

    if (zoom <= 0)
    {
        return;
    }

    const step_px = GRID_STEP * zoom;
    const line_width = Math.max(1, Math.round(zoom * 0.03));

    // 2. 計算目前視窗可見的世界座標範圍
    const min_x_units = Math.floor((-camera.pan_x) / step_px) * GRID_STEP;
    const max_x_units = Math.ceil((w - camera.pan_x) / step_px) * GRID_STEP;

    const min_y_units = Math.floor((camera.pan_y) / step_px) * GRID_STEP;
    const max_y_units = Math.ceil((h + camera.pan_y) / step_px) * GRID_STEP;

    // 3. 繪製精確的網格線
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(176, 176, 176, 0.45)';
    ctx.lineWidth = line_width;

    const offset = (line_width % 2 === 1 ? 0.5 : 0);

    // 垂直網格線
    for (let x = min_x_units; x <= max_x_units; x += GRID_STEP)
    {
        const sx = Math.floor(camera.pan_x + x * zoom) + offset;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
    }

    // 水平網格線
    for (let y = min_y_units; y <= max_y_units; y += GRID_STEP)
    {
        const sy = Math.floor(h + camera.pan_y - y * zoom) + offset;
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
    }

    ctx.stroke();
    ctx.restore();

    // 4. 在地圖邊界繪製黑線 (依據 camera.plane.dim_h 與 dim_v 動態取得世界長度)
    const dim_h  = camera.plane.dim_h;
    const dim_v  = camera.plane.dim_v;
    const size_h = map.size[dim_h];
    const size_v = map.size[dim_v];

    if (size_h > 0 && size_v > 0)
    {
        const sx = camera.pan_x;
        const sy = h + camera.pan_y - size_v * zoom;
        const sw = size_h * zoom;
        const sh = size_v * zoom;

        const border_lw = Math.max(3, zoom * 0.08);
        const half_border_lw = border_lw / 2;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = border_lw;
        ctx.strokeRect(sx - half_border_lw, sy - half_border_lw, sw + border_lw, sh + border_lw);
    }
}
