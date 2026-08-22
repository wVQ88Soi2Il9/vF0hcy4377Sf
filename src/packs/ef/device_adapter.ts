/**
 * EF Machine -> Core OOP Device Adapter
 *
 * 將 EF 機器定義轉換為相容本專案 2.5D 網格與面連接埠規範之 OOP 設備類別。
 */

import type { pack_registry, device_constructor } from '@/API';
import { register_device_class } from '@/API';
import { base_layered_device, type vector_3d } from '@/packs/layered_2d';
import type { camera_type } from '@/packs/basic_renderer';
import type { machine, machine_category, port_def } from './types/machine';
import { get_machine_mode } from './types/machine';
import { machine_list } from './data/machines';

export interface ef_device_color_theme
{
    fill:   string;
    border: string;
    text:   string;
}

/**
 * 依分類標籤取得設備主題配色
 */
export function get_tag_color_theme(tags: readonly machine_category[]): ef_device_color_theme
{
    if (tags.includes('基礎生產'))
    {
        return { fill: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' };
    }
    if (tags.includes('合成製造'))
    {
        return { fill: '#3b2f5c', border: '#8b5cf6', text: '#c4b5fd' };
    }
    if (tags.includes('物流設備'))
    {
        return { fill: '#2e4a3e', border: '#10b981', text: '#a7f3d0' };
    }
    if (tags.includes('倉庫存取'))
    {
        return { fill: '#524023', border: '#f59e0b', text: '#fde68a' };
    }
    if (tags.includes('電力'))
    {
        return { fill: '#4a2323', border: '#ef4444', text: '#fecaca' };
    }
    return { fill: '#27272a', border: '#71717a', text: '#e4e4e7' };
}

/**
 * 將 EF 邊界 Port 方位與 offset 轉換為 2× 網格座標。
 * 遵循「恰好 1 個偶數邊界面，其餘 n-1 個奇數中點」規範。
 */
export function port_def_to_vector_3d(port: port_def, width: number, height: number): vector_3d
{
    const k = port.offset;
    switch (port.side)
    {
        case 'top':
            return [2 * k + 1, 2 * height, 1];
        case 'bottom':
            return [2 * k + 1, 0, 1];
        case 'left':
            return [0, 2 * (height - 1 - k) + 1, 1];
        case 'right':
            return [2 * width, 2 * (height - 1 - k) + 1, 1];
    }
}

/**
 * 產生 width × height 設備之 2× 網格局部單元格集合。
 */
export function machine_to_shape_3d(width: number, height: number): vector_3d[]
{
    const shape: vector_3d[] = [];
    for (let x = 0; x < width; x++)
    {
        for (let y = 0; y < height; y++)
        {
            shape.push([2 * x, 2 * y, 0]);
        }
    }
    return shape;
}

/**
 * 依 machine 定義（與模式）建立具名 OOP 設備類別。
 */
export function create_ef_device_class(m: machine, mode_id?: string): device_constructor
{
    const mode      = get_machine_mode(m, mode_id);
    const shape     = machine_to_shape_3d(m.width, m.height);
    const in_ports  = mode.input_ports.map((p) => port_def_to_vector_3d(p, m.width, m.height));
    const out_ports = mode.output_ports.map((p) => port_def_to_vector_3d(p, m.width, m.height));
    const color     = get_tag_color_theme(m.tags);

    return class ef_machine_device extends base_layered_device
    {
        protected readonly base_shape:        vector_3d[] = shape;
        protected readonly base_input_ports:  vector_3d[] = in_ports;
        protected readonly base_output_ports: vector_3d[] = out_ports;

        public other_info: Record<string, unknown> =
        {
            ef_machine:  m,
            mode_id:     mode.id,
            power:       m.power,
            tags:        m.tags,
            ...(m.other_info ?? {})
        };

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
            ctx.globalAlpha *= 0.8;

            // 1. 底色
            ctx.fillStyle = color.fill;
            ctx.fillRect(sx, sy, sw, sh);

            // 2. 邊框
            const border_lw      = Math.max(1, zoom * 0.04);
            const half_border_lw = border_lw / 2;
            ctx.strokeStyle      = color.border;
            ctx.lineWidth        = border_lw;
            ctx.strokeRect(sx + half_border_lw, sy + half_border_lw, sw - border_lw, sh - border_lw);

            // 3. 名稱與 UID
            ctx.fillStyle    = color.text;
            ctx.font         = `bold ${Math.max(7, zoom * 0.25)}px monospace`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(m.name, sx + sw / 2, sy + sh / 2 - Math.max(4, zoom * 0.12));

            ctx.font = `${Math.max(6, zoom * 0.18)}px monospace`;
            ctx.fillText(`#${this.uid}`, sx + sw / 2, sy + sh / 2 + Math.max(4, zoom * 0.12));

            // 4. 連接埠繪製
            this.draw_ports(ctx, camera);

            ctx.restore();
        }

        private draw_ports(ctx: CanvasRenderingContext2D, camera: camera_type): void
        {
            if (!camera)
            {
                return;
            }
            const { dim_h, dim_v, slices } = camera.plane;
            const canvas_height            = ctx.canvas.height;

            const render_port_list = (ports: vector_3d[], fill_color: string, label: string): void =>
            {
                for (const local_p of ports)
                {
                    const wp = [
                        this.position[0] + local_p[0],
                        this.position[1] + local_p[1],
                        this.position[2] + local_p[2]
                    ] as vector_3d;

                    let on_slice = true;
                    for (let i = 0; i < slices.length; i++)
                    {
                        if (i !== dim_h && i !== dim_v)
                        {
                            if (wp[i] < slices[i] || wp[i] >= slices[i] + 3)
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

                    const port_sx = camera.pan_x + wp[dim_h] * camera.zoom;
                    const port_sy = canvas_height + camera.pan_y - wp[dim_v] * camera.zoom;
                    const radius  = Math.max(3, camera.zoom * 0.12);

                    ctx.beginPath();
                    ctx.arc(port_sx, port_sy, radius, 0, Math.PI * 2);
                    ctx.fillStyle = fill_color;
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = Math.max(1, camera.zoom * 0.03);
                    ctx.stroke();

                    ctx.fillStyle    = '#ffffff';
                    ctx.font         = `bold ${Math.max(6, camera.zoom * 0.12)}px monospace`;
                    ctx.textAlign    = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(label, port_sx, port_sy);
                }
            };

            render_port_list(this.get_port('input'), '#0284c7', 'I');
            render_port_list(this.get_port('output'), '#e11d48', 'O');
        }
    };
}

/**
 * 將所有 EF 機器註冊至 Pack Registry
 */
export function register_all_ef_devices(registry: pack_registry): void
{
    for (const m of machine_list)
    {
        const cls = create_ef_device_class(m);
        register_device_class(registry, `ef:${m.id}`, cls);
    }
}
