import type { device, device_definition } from '@/core/types';
import type { camera_type } from '@/packs/basic_renderer/types';
import type { device_draw_fn } from '@/packs/basic_renderer/draw_registry';
import { draw_ports } from './draw_ports';

export const device_id = 'test:irregular_3d';

export const draw: device_draw_fn = function draw_irregular_3d
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
    ctx.fillStyle = '#6b21a8';
    ctx.fillRect(sx, sy, sw, sh);

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = Math.max(1, zoom * 0.04);
    ctx.strokeRect(sx, sy, sw, sh);

    const uid_text = device ? `#${device.uid}` : '3D_IRR';

    ctx.fillStyle = '#c084fc';
    ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(uid_text, sx + sw / 2, sy + sh / 2);

    if (device && def)
    {
        draw_ports(ctx, device, def, camera);
    }
};


