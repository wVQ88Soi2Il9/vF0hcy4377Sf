/**
 * EF Pack Base Device Class
 *
 * 實作 layered_2d 的 drawable_layered_device 與 rotatable_device 能力契約，
 * 自動處理 2.5D 網格座標、D4 幾何旋轉/翻轉變換、分類主題色彩與 Canvas 多型繪圖。
 */

import { device, type vector, type pack_registry, type device_constructor } from '@/API';
import { register_device_class } from '@/API';
import type { camera_type } from '@/packs/basic_renderer';
import
{
    type drawable_layered_device,
    type rotatable_device,
    type vector_3d,
    type d4_transform,
    apply_d4_point,
    apply_d4_cell_anchor,
    normalize_rotation,
    is_vector_3d,
    add_vector_3d
} from '@/packs/layered_2d';
import type { machine, port_def } from './types';
import { machine_list, machine_map, get_machine } from './data/machines';

/**
 * 2.5D 連接埠座標轉換：
 * 將 EF 的方位 (side) 與邊界 offset 轉換為符合 2× 網格同位規則的 3D 向量。
 *
 * 頂部 (Y = 2h): [2k+1, 2h, 1]
 * 底部 (Y = 0):  [2k+1, 0, 1]
 * 左側 (X = 0):  [0, 2(h - 1 - k) + 1, 1]
 * 右側 (X = 2w): [2w, 2(h - 1 - k) + 1, 1]
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
 * 將 W×H 矩形機器轉換為 2× 網格單元格座標列表：
 * 涵蓋 [0, 2w) × [0, 2h) 中的所有 (2x, 2y, 0) 單元格。
 */
export function machine_to_shape_3d(width: number, height: number): vector_3d[]
{
    const shape: vector_3d[] = [];
    for (let x = 0; x < width; x++)
    {
        for (let y = 0; y < height; y++)
        {
            shape.push([x * 2, y * 2, 0]);
        }
    }
    return shape;
}

export interface ef_device_color_theme
{
    body_fill:   string;
    body_stroke: string;
    text_color:  string;
}

export function get_tag_color_theme(tags: readonly string[]): ef_device_color_theme
{
    if (tags.includes('基礎生產'))
    {
        return { body_fill: '#1e3a8a', body_stroke: '#3b82f6', text_color: '#93c5fd' };
    }
    if (tags.includes('合成製造'))
    {
        return { body_fill: '#4c1d95', body_stroke: '#8b5cf6', text_color: '#c4b5fd' };
    }
    if (tags.includes('物流設備'))
    {
        return { body_fill: '#064e3b', body_stroke: '#10b981', text_color: '#6ee7b7' };
    }
    if (tags.includes('倉庫存取'))
    {
        return { body_fill: '#78350f', body_stroke: '#f59e0b', text_color: '#fde68a' };
    }
    if (tags.includes('電力'))
    {
        return { body_fill: '#831843', body_stroke: '#ec4899', text_color: '#fbcfe8' };
    }
    return { body_fill: '#1e293b', body_stroke: '#64748b', text_color: '#cbd5e1' };
}

/**
 * EF 設備抽象/具體基底類別
 * 實作 drawable_layered_device 與 rotatable_device 能力契約
 */
export class base_ef_device extends device implements drawable_layered_device, rotatable_device
{
    public transform: d4_transform = { rotation: 0, flipped: false };

    private readonly base_shape:        vector_3d[];
    private readonly base_input_ports:  vector_3d[];
    private readonly base_output_ports: vector_3d[];
    private readonly display_name:      string;
    private readonly theme:             ef_device_color_theme;

    constructor
    (
        uid:           number,
        definition_id: string,
        position:      vector,
        other_info?:   Record<string, unknown>
    )
    {
        if (!is_vector_3d(position))
        {
            throw new Error(`[ef] Invalid device position: expected 3-element [x, y, z] vector, got ${JSON.stringify(position)}`);
        }
        super(uid, definition_id, position);

        // 解析 machine 定義
        const raw_id = definition_id.includes(':')
            ? definition_id.slice(definition_id.indexOf(':') + 1)
            : definition_id;

        const m = machine_map.get(raw_id) ?? get_machine(raw_id);
        if (!m)
        {
            throw new Error(`[ef] Unknown machine definition: "${definition_id}"`);
        }

        const mode_id = (other_info?.mode_id as string) || m.modes[0]?.id;
        const mode = m.modes.find(item => item.id === mode_id) || m.modes[0] || {
            id:           'default',
            label:        'Default',
            input_ports:  [],
            output_ports: [],
            loss:         null
        };

        this.display_name = m.name;
        this.theme = get_tag_color_theme(m.tags);
        this.base_shape = machine_to_shape_3d(m.width, m.height);
        this.base_input_ports = mode.input_ports.map(p => port_def_to_vector_3d(p, m.width, m.height));
        this.base_output_ports = mode.output_ports.map(p => port_def_to_vector_3d(p, m.width, m.height));

        this.other_info = {
            name:    m.name,
            power:   m.power,
            width:   m.width,
            height:  m.height,
            mode_id: mode.id,
            ...other_info
        };
    }

    public get_layer(): number
    {
        return this.position[2];
    }

    public get_shape(): vector_3d[]
    {
        return this.base_shape.map(v => apply_d4_cell_anchor(v, this.transform));
    }

    public get_shape_3d(): vector_3d[]
    {
        return this.get_shape();
    }

    public get_port(type: 'input' | 'output'): vector_3d[]
    {
        const ports = type === 'input' ? this.base_input_ports : this.base_output_ports;
        return ports.map(v => apply_d4_point(v, this.transform));
    }

    public get_port_3d(type: 'input' | 'output'): vector_3d[]
    {
        return this.get_port(type);
    }

    public rotate(steps: number = 1): void
    {
        this.transform.rotation = normalize_rotation(this.transform.rotation + steps);
    }

    public flip(): void
    {
        this.transform.flipped = !this.transform.flipped;
    }

    public set_transform(transform: d4_transform): void
    {
        this.transform = {
            rotation: normalize_rotation(transform.rotation),
            flipped:  Boolean(transform.flipped)
        };
    }

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
        ctx.globalAlpha *= 0.85;

        const { dim_h, dim_v } = camera.plane;
        const canvas_height = ctx.canvas.height;
        const transformed_shape = this.get_shape();

        // 1. 繪製所有多單元格本體
        ctx.fillStyle = this.theme.body_fill;
        ctx.strokeStyle = this.theme.body_stroke;
        const border_lw = Math.max(1, zoom * 0.04);
        ctx.lineWidth = border_lw;

        for (const cell of transformed_shape)
        {
            const cell_wx = (this.position[dim_h] ?? 0) + cell[dim_h];
            const cell_wy = (this.position[dim_v] ?? 0) + cell[dim_v];

            const cell_sx = camera.pan_x + cell_wx * camera.zoom;
            const cell_sy = canvas_height + camera.pan_y - (cell_wy + 2) * camera.zoom;
            const cell_sw = 2 * camera.zoom;
            const cell_sh = 2 * camera.zoom;

            ctx.fillRect(cell_sx, cell_sy, cell_sw, cell_sh);
            ctx.strokeRect(cell_sx, cell_sy, cell_sw, cell_sh);
        }

        // 2. 繪製中心標籤與 UID
        ctx.fillStyle = this.theme.text_color;
        ctx.font = `bold ${Math.max(8, zoom * 0.25)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const label_text = `#${this.uid} ${this.display_name}`;
        ctx.fillText(label_text, sx + sw / 2, sy + sh / 2);

        // 3. 繪製輸入與輸出連接埠
        this.draw_ef_ports(ctx, this.get_port('input'), '#38bdf8', '#0284c7', 'I', camera);
        this.draw_ef_ports(ctx, this.get_port('output'), '#f43f5e', '#be123c', 'O', camera);

        ctx.restore();
    }

    private draw_ef_ports
    (
        ctx:          CanvasRenderingContext2D,
        ports:        vector_3d[],
        color:        string,
        border_color: string,
        label:        string,
        camera:       camera_type
    ): void
    {
        const { dim_h, dim_v, slices } = camera.plane;
        const canvas_height = ctx.canvas.height;

        for (const local_port of ports)
        {
            const wp = add_vector_3d(this.position as vector_3d, local_port);

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
    }
}

/**
 * 建立特定 EF 機器之具名 Class（保留多型建構彈性）
 */
export function create_ef_device_class(m: machine, mode_id?: string): device_constructor
{
    return class extends base_ef_device
    {
        constructor(uid: number, definition_id: string, position: vector, other_info?: Record<string, unknown>)
        {
            super(uid, definition_id, position, { mode_id: mode_id || m.modes[0]?.id, ...other_info });
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
