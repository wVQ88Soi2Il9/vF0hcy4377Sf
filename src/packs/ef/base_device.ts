/**
 * EF Pack Base Device Class
 */

import { type vector, type pack_registry, type device_constructor, register_device_class, type namespaced_id } from '@/API';
import type { camera_type } from '@/packs/basic_renderer';
import type { base_cuboid_device } from '@/packs/cuboid_device';
import { cuboid_to_shape } from '@/packs/cuboid_device';
import
{
    base_layered_device,
    type vector_3d,
    add_vector_3d
} from '@/packs/layered_2d';
import type { machine, port_def } from './types';
import { machine_list, get_machine, get_machine_by_id } from './data/machines';

// ─── 輔助函式與主題配置 ────────────────────────────────────────────────────────

export function resolve_machine(id_or_name: string): machine | undefined
{
    const raw_id = id_or_name.includes(':') ? id_or_name.split(':')[1] : id_or_name;
    return get_machine_by_id(raw_id) ?? get_machine(raw_id);
}

export interface ef_device_color_theme
{
    body_fill:   string;
    body_stroke: string;
    text_color:  string;
}

const TAG_THEMES: Record<string, ef_device_color_theme> =
{
    '基礎生產': { body_fill: '#1e3a8a', body_stroke: '#3b82f6', text_color: '#93c5fd' },
    '合成製造': { body_fill: '#4c1d95', body_stroke: '#8b5cf6', text_color: '#c4b5fd' },
    '物流設備': { body_fill: '#064e3b', body_stroke: '#10b981', text_color: '#6ee7b7' },
    '倉庫存取': { body_fill: '#78350f', body_stroke: '#f59e0b', text_color: '#fde68a' },
    '電力':     { body_fill: '#831843', body_stroke: '#ec4899', text_color: '#fbcfe8' }
};

const DEFAULT_THEME: ef_device_color_theme = { body_fill: '#1e293b', body_stroke: '#64748b', text_color: '#cbd5e1' };

export function get_tag_color_theme(tags: readonly string[]): ef_device_color_theme
{
    for (const tag of tags)
    {
        if (TAG_THEMES[tag])
        {
            return TAG_THEMES[tag];
        }
    }
    return DEFAULT_THEME;
}

export function port_def_to_vector_3d(p: port_def, w: number, h: number): vector_3d
{
    const k = p.offset;
    if (p.side === 'top')
    {
        return [2 * k + 1, 2 * h, 1];
    }
    if (p.side === 'bottom')
    {
        return [2 * k + 1, 0, 1];
    }
    if (p.side === 'left')
    {
        return [0, 2 * (h - 1 - k) + 1, 1];
    }
    return [2 * w, 2 * (h - 1 - k) + 1, 1];
}

export function machine_to_shape_3d(w: number, h: number): vector_3d[]
{
    return cuboid_to_shape([w * 2, h * 2, 2]) as vector_3d[];
}

// ─── EF 設備基底類別 ──────────────────────────────────────────────────────────

export class base_ef_device extends base_layered_device implements base_cuboid_device
{
    public readonly device_size:        vector_3d;
    protected readonly base_shape:        vector_3d[];
    protected readonly base_input_ports:  vector_3d[];
    protected readonly base_output_ports: vector_3d[];

    constructor
    (
        uid:         number,
        def_id:      namespaced_id,
        pos:         vector,
        other_info?: Record<string, unknown>
    )
    {
        super(uid, def_id, pos);

        const m = resolve_machine(def_id.id);
        if (!m)
        {
            throw new Error(`[ef] Unknown machine: "${def_id.pack}:${def_id.id}"`);
        }

        const ef_info = (other_info?.ef as Record<string, unknown> | undefined) || {};
        const mode_id = (ef_info.mode_id as string) || (other_info?.mode_id as string) || m.modes[0]?.id || 'default';
        const mode = m.modes.find(item => item.id === mode_id) || m.modes[0];

        this.device_size = [m.width * 2, m.height * 2, 2];
        this.base_shape = machine_to_shape_3d(m.width, m.height);
        this.base_input_ports = mode.input_ports.map(p => port_def_to_vector_3d(p, m.width, m.height));
        this.base_output_ports = mode.output_ports.map(p => port_def_to_vector_3d(p, m.width, m.height));

        this.other_info =
        {
            ...other_info,
            ef:
            {
                ...ef_info,
                name:    m.name,
                power:   m.power,
                width:   m.width,
                height:  m.height,
                mode_id
            }
        };
    }

    private get_machine(): machine
    {
        return resolve_machine(this.definition_id.id)!;
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
        const m = this.get_machine();
        const theme = get_tag_color_theme(m.tags);
        const { dim_h, dim_v } = camera.plane;
        const canvas_h = ctx.canvas.height;

        ctx.save();
        ctx.globalAlpha *= 0.85;
        ctx.fillStyle = theme.body_fill;
        ctx.strokeStyle = theme.body_stroke;
        ctx.lineWidth = Math.max(1, zoom * 0.04);

        // 1. 繪製單元格本體（填滿內部）
        for (const cell of this.get_shape())
        {
            const cell_sx = camera.pan_x + (this.position[dim_h] + cell[dim_h]) * camera.zoom;
            const cell_sy = canvas_h + camera.pan_y - (this.position[dim_v] + cell[dim_v] + 2) * camera.zoom;
            ctx.fillRect(cell_sx, cell_sy, 2 * camera.zoom, 2 * camera.zoom);
        }

        // 外圍邊框
        ctx.strokeRect(sx, sy, sw, sh);

        // 2. 繪製標籤
        const text = `#${this.uid} ${m.name}`;
        ctx.font = `bold ${Math.max(8, zoom * 0.25)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 黑色外框描邊 (Black Outline)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(2, zoom * 0.06);
        ctx.lineJoin = 'round';
        ctx.strokeText(text, sx + sw / 2, sy + sh / 2);

        // 文字填色
        ctx.fillStyle = theme.text_color;
        ctx.fillText(text, sx + sw / 2, sy + sh / 2);

        // 3. 繪製連接埠
        this.draw_ports(ctx, this.get_port('input'), '#38bdf8', '#0284c7', 'I', camera);
        this.draw_ports(ctx, this.get_port('output'), '#f43f5e', '#be123c', 'O', camera);
        ctx.restore();
    }

    private draw_ports
    (
        ctx:    CanvasRenderingContext2D,
        ports:  vector_3d[],
        color:  string,
        border: string,
        label:  string,
        camera: camera_type
    ): void
    {
        const { dim_h, dim_v, slices } = camera.plane;
        const canvas_h = ctx.canvas.height;
        const r = Math.max(3, camera.zoom * 0.12);

        for (const port of ports)
        {
            const wp = add_vector_3d(this.position as vector_3d, port);
            if (slices.some((s, i) => i !== dim_h && i !== dim_v && (wp[i] < s || wp[i] >= s + 3)))
            {
                continue;
            }

            const px = camera.pan_x + wp[dim_h] * camera.zoom;
            const py = canvas_h + camera.pan_y - wp[dim_v] * camera.zoom;

            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = border;
            ctx.lineWidth = Math.max(1, camera.zoom * 0.03);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(6, camera.zoom * 0.12)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, px, py);
        }
    }
}

export function create_ef_device_class(m: machine, mode_id?: string): device_constructor
{
    return class extends base_ef_device
    {
        constructor(uid: number, def_id: namespaced_id, pos: vector, info?: Record<string, unknown>)
        {
            super(uid, def_id, pos, { mode_id: mode_id || m.modes[0]?.id, ...info });
        }
    };
}

export function register_all_ef_devices(registry: pack_registry): void
{
    for (const m of machine_list)
    {
        register_device_class(registry, { pack: 'ef', id: m.id }, create_ef_device_class(m));
    }
}
