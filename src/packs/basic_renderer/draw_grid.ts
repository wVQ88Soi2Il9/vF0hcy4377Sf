import grid_svg_url from './assets/grid.svg';   // Vite 幫你轉成 URL
import type { game_map } from '@/core/types';
import type { camera_type } from './types';

const SVG_TILE_SIZE = 64;

// 圖片只載入一次（模組層級）
const grid_img = new Image();
grid_img.src = grid_svg_url;

export function draw_grid
(
    ctx:    CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    camera: camera_type,
    map:    game_map
): void
{
    if (!grid_img.complete)
    {
        return;  // 還沒載入完就跳過
    }

    ctx.imageSmoothingEnabled = false;

    const pattern = ctx.createPattern(grid_img, 'repeat')!;

    // 讓 pattern 跟著 camera 移動和縮放
    pattern.setTransform(new DOMMatrix()
        .translate(camera.pan_x, canvas.height + camera.pan_y)
        .scale(camera.zoom / SVG_TILE_SIZE)
    );

    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 在地圖邊界繪製黑線 (依據 camera.plane.dim_h 與 dim_v 動態取得世界長度)
    const dim_h  = camera.plane.dim_h;
    const dim_v  = camera.plane.dim_v;
    const size_h = map.size[dim_h];
    const size_v = map.size[dim_v];

    if (size_h > 0 && size_v > 0)
    {
        const sx = camera.pan_x;
        const sy = canvas.height + camera.pan_y - size_v * camera.zoom;
        const sw = size_h * camera.zoom;
        const sh = size_v * camera.zoom;

        const border_lw = Math.max(4, camera.zoom * 0.08);
        const half_border_lw = border_lw / 2;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = border_lw;
        ctx.strokeRect(sx - half_border_lw, sy - half_border_lw, sw + border_lw, sh + border_lw);
    }
}
