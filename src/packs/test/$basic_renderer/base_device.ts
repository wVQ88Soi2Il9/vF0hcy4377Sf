import type { device, device_definition } from '@/core/types';
import type { camera_type } from '@/packs/basic_renderer/types';
import { get_map, get_registry } from '@/runtime';
import { vanilla } from '@/packs/vanilla';
import { draw_ports } from './draw_ports';

export interface device_color_theme
{
    fill:   string;
    border: string;
}

/**
 * Common device drawing template for test pack devices:
 * - alpha = 0.75 translucent body
 * - Solid rectangle + deep tone inner border (strokeRect half_lw inner inset)
 * - Centered #UID text
 * - Input/Output ports
 * - Light red translucent overlay and border when overlapped
 */
export function draw_test_device_template
(
    ctx:            CanvasRenderingContext2D,
    sx:             number,
    sy:             number,
    sw:             number,
    sh:             number,
    zoom:           number,
    theme:          device_color_theme,
    device?:        device,
    def?:           device_definition,
    camera?:        camera_type,
    fallback_label: string = 'DEV'
): void
{
    ctx.save();
    ctx.globalAlpha = 0.75;

    // 1. 純色矩形
    ctx.fillStyle = theme.fill;
    ctx.fillRect(sx, sy, sw, sh);

    // 2. 同色系深色邊框（內縮 half_border_lw，確保完全在 grid 內部）
    const border_lw = Math.max(1, zoom * 0.04);
    const half_border_lw = border_lw / 2;
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = border_lw;
    ctx.strokeRect(sx + half_border_lw, sy + half_border_lw, sw - border_lw, sh - border_lw);

    // 3. 裝置 #UID 標籤
    const uid_text = device ? `#${device.uid}` : fallback_label;
    ctx.fillStyle = theme.border;
    ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(uid_text, sx + sw / 2, sy + sh / 2);

    // 4. 連接埠
    if (device && def)
    {
        draw_ports(ctx, device, def, camera);
    }

    // 5. 若發生重疊，以淡紅色包覆（外框同樣內縮於 grid 內部）
    if (device)
    {
        const map = get_map();
        const registry = get_registry();
        if (map && registry)
        {
            const validation = vanilla.check_map_overlap(map, registry);
            const overlapped = validation.overlapped.includes(device.uid);
            if (overlapped)
            {
                ctx.fillStyle = 'rgba(248, 113, 113, 0.45)';
                ctx.fillRect(sx, sy, sw, sh);

                const red_lw = Math.max(2, zoom * 0.05);
                const half_red_lw = red_lw / 2;
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = red_lw;
                ctx.strokeRect(sx + half_red_lw, sy + half_red_lw, sw - red_lw, sh - red_lw);
            }
        }
    }

    ctx.restore();
}
