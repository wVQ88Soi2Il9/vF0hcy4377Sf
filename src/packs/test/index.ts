import type { device, device_definition } from '@/core/types';
import type { camera_type } from '@/packs/basic_renderer/types';
import { basic_renderer } from '@/packs/basic_renderer';

// Color themes per slice depth (Z depth or non-displayed dimension depth)
const slice_palettes: Array<Array<{ fill: string; border: string }>> = [
    // Slice depth 0 (Red / Pink spectrum)
    [
        { fill: '#f43f5e', border: '#fda4af' },
        { fill: '#e11d48', border: '#fecdd3' },
        { fill: '#be123c', border: '#ffe4e6' },
        { fill: '#9f1239', border: '#ffffff' },
        { fill: '#881337', border: '#fda4af' }
    ],
    // Slice depth 1 / depth coord 2 (Green / Emerald spectrum)
    [
        { fill: '#34d399', border: '#a7f3d0' },
        { fill: '#10b981', border: '#d1fae5' },
        { fill: '#059669', border: '#ecfdf5' },
        { fill: '#047857', border: '#ffffff' },
        { fill: '#065f46', border: '#a7f3d0' }
    ],
    // Slice depth 2 / depth coord 4 (Violet / Indigo spectrum)
    [
        { fill: '#a78bfa', border: '#ddd6fe' },
        { fill: '#8b5cf6', border: '#ede9fe' },
        { fill: '#7c3aed', border: '#f5f3ff' },
        { fill: '#6d28d9', border: '#ffffff' },
        { fill: '#5b21b6', border: '#ddd6fe' }
    ]
];

/**
 * Draw function for test:assembler
 */
function draw_assembler
(
    ctx:  CanvasRenderingContext2D,
    sx:   number,
    sy:   number,
    sw:   number,
    sh:   number,
    zoom: number
): void
{
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(sx, sy, sw, sh);

    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = Math.max(1, zoom * 0.04);
    ctx.strokeRect(sx, sy, sw, sh);

    ctx.fillStyle = '#4a90d9';
    ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ASM', sx + sw / 2, sy + sh / 2);
}

/**
 * Draw function for test:belt
 */
function draw_belt
(
    ctx:  CanvasRenderingContext2D,
    sx:   number,
    sy:   number,
    sw:   number,
    sh:   number,
    zoom: number
): void
{
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(sx, sy, sw, sh);

    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = Math.max(1, zoom * 0.04);
    ctx.strokeRect(sx, sy, sw, sh);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑', sx + sw / 2, sy + sh / 2);
}

/**
 * Draw function for test:splitter
 */
function draw_splitter
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
}

/**
 * Draw function for test:merger
 */
function draw_merger
(
    ctx:  CanvasRenderingContext2D,
    sx:   number,
    sy:   number,
    sw:   number,
    sh:   number,
    zoom: number
): void
{
    ctx.fillStyle = '#0a2e1a';
    ctx.fillRect(sx, sy, sw, sh);

    ctx.strokeStyle = '#40c070';
    ctx.lineWidth = Math.max(1, zoom * 0.04);
    ctx.strokeRect(sx, sy, sw, sh);

    ctx.fillStyle = '#40c070';
    ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MRG', sx + sw / 2, sy + sh / 2);
}

/**
 * Draw function for test:irregular_3d
 */
function draw_irregular_3d
(
    ctx:  CanvasRenderingContext2D,
    sx:   number,
    sy:   number,
    sw:   number,
    sh:   number,
    zoom: number
): void
{
    ctx.fillStyle = '#6b21a8';
    ctx.fillRect(sx, sy, sw, sh);

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = Math.max(1, zoom * 0.04);
    ctx.strokeRect(sx, sy, sw, sh);

    ctx.fillStyle = '#c084fc';
    ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('3D_IRR', sx + sw / 2, sy + sh / 2);
}

/**
 * Draw function for test:long_bar
 * Each cross-section segment along the bar has a distinct color.
 * Different camera slice depths (Z-depths) render with completely unique color themes.
 */
function draw_long_bar
(
    ctx:     CanvasRenderingContext2D,
    sx:      number,
    sy:      number,
    sw:      number,
    sh:      number,
    zoom:    number,
    device?: device,
    def?:    device_definition,
    camera?: camera_type
): void
{
    // Determine slice depth index from non-displayed dimensions in camera plane
    let palette_idx = 0;
    if (camera)
    {
        const { dim_h, dim_v, slices } = camera.plane;
        for (let i = 0; i < slices.length; i++)
        {
            if (i !== dim_h && i !== dim_v)
            {
                const slice_depth = slices[i];
                // Half-grid coord to integer index (0, 2, 4 -> 0, 1, 2)
                palette_idx = Math.max(0, Math.floor(slice_depth / 2));
                break;
            }
        }
    }

    const palette = slice_palettes[palette_idx % slice_palettes.length];

    // Determine orientation of the bar in screen space (horizontal vs vertical)
    if (sw >= sh)
    {
        const segment_count = Math.max(1, Math.round(sw / zoom));
        const seg_w = sw / segment_count;

        for (let k = 0; k < segment_count; k++)
        {
            const seg_x = sx + k * seg_w;
            const style = palette[k % palette.length];

            ctx.fillStyle = style.fill;
            ctx.fillRect(seg_x, sy, seg_w, sh);

            ctx.strokeStyle = style.border;
            ctx.lineWidth = Math.max(1, zoom * 0.04);
            ctx.strokeRect(seg_x, sy, seg_w, sh);

            ctx.fillStyle = style.border;
            ctx.font = `bold ${Math.max(8, zoom * 0.25)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`S${k}`, seg_x + seg_w / 2, sy + sh / 2);
        }
    }
    else
    {
        const segment_count = Math.max(1, Math.round(sh / zoom));
        const seg_h = sh / segment_count;

        for (let k = 0; k < segment_count; k++)
        {
            const seg_y = sy + k * seg_h;
            const style = palette[k % palette.length];

            ctx.fillStyle = style.fill;
            ctx.fillRect(sx, seg_y, sw, seg_h);

            ctx.strokeStyle = style.border;
            ctx.lineWidth = Math.max(1, zoom * 0.04);
            ctx.strokeRect(sx, seg_y, sw, seg_h);

            ctx.fillStyle = style.border;
            ctx.font = `bold ${Math.max(8, zoom * 0.25)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`S${k}`, sx + sw / 2, seg_y + seg_h / 2);
        }
    }

    // Outer bounding highlight box
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, zoom * 0.02);
    ctx.strokeRect(sx, sy, sw, sh);
}

/**
 * Initialization function for test pack.
 * Registers explicit draw functions for all devices in test pack.
 */
export function init_pack(): void
{
    basic_renderer.register_draw('test:assembler', draw_assembler);
    basic_renderer.register_draw('test:belt', draw_belt);
    basic_renderer.register_draw('test:splitter', draw_splitter);
    basic_renderer.register_draw('test:merger', draw_merger);
    basic_renderer.register_draw('test:irregular_3d', draw_irregular_3d);
    basic_renderer.register_draw('test:long_bar', draw_long_bar);
}
