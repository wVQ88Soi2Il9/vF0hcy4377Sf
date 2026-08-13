import type { device, device_definition } from '@/core/types';
import type { camera_type } from '@/packs/basic_renderer/types';
import type { device_draw_fn } from '@/packs/basic_renderer/draw_registry';
import { draw_ports } from './draw_ports';

export const device_id = 'test:long_bar';

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

export const draw: device_draw_fn = function draw_long_bar
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
                palette_idx = Math.max(0, Math.floor(slice_depth / 2));
                break;
            }
        }
    }

    const palette = slice_palettes[palette_idx % slice_palettes.length];
    const uid_prefix = device ? `#${device.unique_id}` : 'S';

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
            ctx.fillText(`${uid_prefix}`, seg_x + seg_w / 2, sy + sh / 2);
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
            ctx.fillText(`${uid_prefix}`, sx + sw / 2, seg_y + seg_h / 2);
        }
    }

    // Outer bounding highlight box
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, zoom * 0.02);
    ctx.strokeRect(sx, sy, sw, sh);

    if (device && def)
    {
        draw_ports(ctx, device, def, camera);
    }
};

