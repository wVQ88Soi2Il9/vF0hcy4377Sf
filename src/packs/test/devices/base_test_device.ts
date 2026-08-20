import { device, type vector } from '@/API';
import type { drawable_device, camera_type } from '@/packs/basic_renderer';
import { get_map } from '@/runtime';
import { vanilla } from '@/packs/vanilla';
import { add_vector } from '@/utils/math';

export interface device_color_theme
{
    fill:   string;
    border: string;
}

/**
 * Common abstract base class for all test pack devices.
 * Implements drawable_device to provide a unified rectangle + deep border + UID + ports renderer.
 */
export abstract class base_test_device extends device implements drawable_device
{
    public abstract get_shape(): vector[];
    public abstract get_port(type: 'input' | 'output'): vector[];
    protected abstract get_color_theme(camera?: camera_type): device_color_theme;

    /**
     * Draws input and output ports for this device.
     */
    protected draw_ports(ctx: CanvasRenderingContext2D, camera?: camera_type): void
    {
        if (!camera)
        {
            return;
        }

        const { dim_h, dim_v, slices } = camera.plane;
        const canvas_height = ctx.canvas.height;

        const render_port_list =
        (
            ports:        vector[],
            color:        string,
            border_color: string,
            label:        string
        ): void =>
        {
            for (const local_port of ports)
            {
                const wp = add_vector(this.position, local_port);

                // Check if port lies on or adjacent to current camera slice along non-displayed dimensions
                let on_slice = true;
                for (let i = 0; i < slices.length; i++)
                {
                    if (i !== dim_h && i !== dim_v)
                    {
                        if (slices[i] < wp[i] - 1 || slices[i] > wp[i] + 1)
                        {
                            on_slice = false;
                            break;
                        }
                    }
                }

                if (!on_slice)
                {
                    continue;
                }

                const port_sx = camera.pan_x + (wp[dim_h] + 1) * camera.zoom;
                const port_sy = canvas_height + camera.pan_y - (wp[dim_v] + 1) * camera.zoom;
                const radius  = Math.max(3, camera.zoom * 0.12);

                ctx.beginPath();
                ctx.arc(port_sx, port_sy, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = border_color;
                ctx.lineWidth = Math.max(1, camera.zoom * 0.03);
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${Math.max(6, camera.zoom * 0.12)}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, port_sx, port_sy);
            }
        };

        const in_ports  = this.get_port('input');
        const out_ports = this.get_port('output');

        render_port_list(in_ports, '#38bdf8', '#0284c7', 'I');
        render_port_list(out_ports, '#f43f5e', '#be123c', 'O');
    }

    /**
     * Unified device drawing template: solid rectangle + deep tone border + UID label + ports.
     * When overlapped === true, wraps the device in a light red overlay and border.
     */
    public draw
    (
        ctx:    CanvasRenderingContext2D,
        sx:     number,
        sy:     number,
        sw:     number,
        sh:     number,
        zoom:   number,
        camera: camera_type
    ): void
    {
        ctx.save();
        ctx.globalAlpha = 0.75;

        const { fill, border } = this.get_color_theme(camera);

        // 1. 純色矩形
        ctx.fillStyle = fill;
        ctx.fillRect(sx, sy, sw, sh);

        // 2. 同色系深色邊框（內縮 half_border_lw，確保完全在 grid 內部）
        const border_lw = Math.max(1, zoom * 0.04);
        const half_border_lw = border_lw / 2;
        ctx.strokeStyle = border;
        ctx.lineWidth = border_lw;
        ctx.strokeRect(sx + half_border_lw, sy + half_border_lw, sw - border_lw, sh - border_lw);

        // 3. 裝置 #UID 標籤
        ctx.fillStyle = border;
        ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${this.uid}`, sx + sw / 2, sy + sh / 2);

        // 4. 連接埠
        this.draw_ports(ctx, camera);

        // 5. 若發生重疊，以淡紅色包覆（外框同樣內縮於 grid 內部）
        const map = get_map();
        if (map)
        {
            const validation = vanilla.check_map_overlap(map);
            const overlapped = validation.overlapped.includes(this.uid);
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

        ctx.restore();
    }
}
