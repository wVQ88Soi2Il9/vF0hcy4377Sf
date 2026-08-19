import type { device, device_definition } from '@/core/types';
import type { camera_type } from '@/packs/basic_renderer/types';
import type { device_draw_fn } from '@/packs/basic_renderer/draw_registry';
import { draw_ports } from './draw_ports';

export const device_id = 'test:pipe';

export const draw: device_draw_fn = function draw_pipe
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
    // Draw pipe body
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(sx, sy, sw, sh);

    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = Math.max(1, zoom * 0.04);
    ctx.strokeRect(sx, sy, sw, sh);

    const length = typeof device?.other_info?.length === 'number' ? device.other_info.length : 1;
    const uid_text = device ? `#${device.uid} (${length}L)` : 'PIPE';

    ctx.fillStyle = '#ccfbf1';
    ctx.font = `bold ${Math.max(8, zoom * 0.28)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(uid_text, sx + sw / 2, sy + sh / 2);

    if (device && def)
    {
        draw_ports(ctx, device, def, camera);
    }
};
