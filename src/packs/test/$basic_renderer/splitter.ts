import type { device_draw_fn } from '@/packs/basic_renderer/draw_registry';

export const device_id = 'test:splitter';

export const draw: device_draw_fn = function draw_splitter
(
    ctx:  CanvasRenderingContext2D,
    sx:   number,
    sy:   number,
    sw:   number,
    sh:   number,
    zoom: number
): void
{
    ctx.fillStyle = '#4a2800';
    ctx.fillRect(sx, sy, sw, sh);

    ctx.strokeStyle = '#f0a040';
    ctx.lineWidth = Math.max(1, zoom * 0.04);
    ctx.strokeRect(sx, sy, sw, sh);

    ctx.fillStyle = '#f0a040';
    ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPL', sx + sw / 2, sy + sh / 2);
};
