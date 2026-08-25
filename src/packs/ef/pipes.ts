/**
 * EF Pack Pipe Devices
 *
 * 實作 solidpipe（固體傳送管）、liquidpipe（液體輸送管）、gaspipe（氣體輸送管），
 * 繼承 packs/pipe 的 pipe 抽象基底類別並實作 2.5D 連接埠與 Canvas 繪製。
 */

import type { camera_type, drawable_device } from '@/packs/basic_renderer';
import { pipe } from '@/packs/pipe';
import { type vector_3d, add_vector_3d } from '@/packs/layered_2d';
import type { item_form } from './types';

export interface ef_pipe_color_theme
{
    body_fill:   string;
    body_stroke: string;
    text_color:  string;
}

/**
 * EF 管線抽象基底類別
 */
export abstract class base_ef_pipe extends pipe implements drawable_device
{
    public abstract readonly form:         item_form;
    public abstract readonly display_name: string;
    public abstract readonly theme:        ef_pipe_color_theme;

    public get_layer(): number
    {
        return this.position[2] ?? 0;
    }

    public get_port(type: 'input' | 'output'): vector_3d[]
    {
        const shape = this.get_shape() as vector_3d[];
        if (shape.length === 0)
        {
            return [];
        }

        const start_cell = shape[0];
        const end_cell = shape[shape.length - 1];

        if (type === 'input')
        {
            const first_seg = this.segments[0];
            const axis = first_seg ? first_seg.axis : 0;
            const sign = first_seg && first_seg.delta < 0 ? 1 : -1;

            const port: vector_3d = [start_cell[0], start_cell[1], start_cell[2]];
            if (axis === 0)
            {
                port[0] = sign < 0 ? start_cell[0] : start_cell[0] + 2;
                port[1] = start_cell[1] + 1;
            }
            else if (axis === 1)
            {
                port[0] = start_cell[0] + 1;
                port[1] = sign < 0 ? start_cell[1] : start_cell[1] + 2;
            }
            else
            {
                port[0] = start_cell[0] + 1;
                port[1] = start_cell[1] + 1;
                port[2] = sign < 0 ? start_cell[2] : start_cell[2] + 2;
            }
            return [port];
        }
        else
        {
            const last_seg = this.segments[this.segments.length - 1];
            const axis = last_seg ? last_seg.axis : 0;
            const sign = last_seg && last_seg.delta < 0 ? -1 : 1;

            const port: vector_3d = [end_cell[0], end_cell[1], end_cell[2]];
            if (axis === 0)
            {
                port[0] = sign > 0 ? end_cell[0] + 2 : end_cell[0];
                port[1] = end_cell[1] + 1;
            }
            else if (axis === 1)
            {
                port[0] = end_cell[0] + 1;
                port[1] = sign > 0 ? end_cell[1] + 2 : end_cell[1];
            }
            else
            {
                port[0] = end_cell[0] + 1;
                port[1] = end_cell[1] + 1;
                port[2] = sign > 0 ? end_cell[2] + 2 : end_cell[2];
            }
            return [port];
        }
    }

    public draw
    (
        ctx:    CanvasRenderingContext2D,
        _sx:    number,
        _sy:    number,
        _sw:    number,
        _sh:    number,
        zoom:   number,
        camera: camera_type
    ): void
    {
        ctx.save();
        ctx.globalAlpha *= 0.85;

        const { dim_h, dim_v, slices } = camera.plane;
        const canvas_height = ctx.canvas.height;
        const shape = this.get_shape() as vector_3d[];

        // Pipe diameter: 60% of cell size (1.2 / 2.0 grid units), with border = outer - inner
        const pipe_outer = Math.max(2, zoom * 0.6);
        const pipe_inner = Math.max(1, zoom * 0.44);

        // Compute ordered center points for each cell (null = off-slice / hidden)
        const cell_centers: ({ x: number; y: number } | null)[] = shape.map(local_cell =>
        {
            const wp = add_vector_3d(this.position as vector_3d, local_cell);
            for (let i = 0; i < slices.length; i++)
            {
                if (i !== dim_h && i !== dim_v)
                {
                    if (wp[i] < slices[i] || wp[i] >= slices[i] + 3)
                    {
                        return null;
                    }
                }
            }
            return {
                x: camera.pan_x + (wp[dim_h] + 1) * zoom,
                y: canvas_height + camera.pan_y - (wp[dim_v] + 1) * zoom
            };
        });

        // Extend polyline endpoints to the actual port positions
        // so the pipe graphic visually touches the port circles.
        const port_to_canvas = (local_port: vector_3d): { x: number; y: number } =>
        {
            const wp = add_vector_3d(this.position as vector_3d, local_port);
            return {
                x: camera.pan_x + wp[dim_h] * zoom,
                y: canvas_height + camera.pan_y - wp[dim_v] * zoom
            };
        };

        const in_ports  = this.get_port('input');
        const out_ports = this.get_port('output');

        const centers: ({ x: number; y: number } | null)[] =
        [
            in_ports.length  > 0 ? port_to_canvas(in_ports[0])  : cell_centers[0] ?? null,
            ...cell_centers,
            out_ports.length > 0 ? port_to_canvas(out_ports[0]) : cell_centers[cell_centers.length - 1] ?? null
        ];

        // Draw pipe as polyline: first thick pass (border), then thin pass (fill)
        const draw_pass = (line_width: number, color: string): void =>
        {
            ctx.lineWidth   = line_width;
            ctx.strokeStyle = color;
            ctx.lineCap     = 'round';
            ctx.lineJoin    = 'round';

            let in_path = false;
            for (const pt of centers)
            {
                if (pt !== null)
                {
                    if (!in_path)
                    {
                        ctx.beginPath();
                        ctx.moveTo(pt.x, pt.y);
                        in_path = true;
                    }
                    else
                    {
                        ctx.lineTo(pt.x, pt.y);
                    }
                }
                else
                {
                    if (in_path)
                    {
                        ctx.stroke();
                        in_path = false;
                    }
                }
            }
            if (in_path)
            {
                ctx.stroke();
            }
        };

        // 1. Outer pass → border colour
        draw_pass(pipe_outer, this.theme.body_stroke);
        // 2. Inner pass → fill colour
        draw_pass(pipe_inner, this.theme.body_fill);

        // 3. Label at centre of visible segment
        const visible_centers = centers.filter((c): c is { x: number; y: number } => c !== null);
        if (visible_centers.length > 0)
        {
            const mid = visible_centers[Math.floor(visible_centers.length / 2)];
            const text = `#${this.uid} ${this.display_name}`;
            ctx.font = `bold ${Math.max(8, zoom * 0.25)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 黑色外框描邊 (Black Outline)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = Math.max(2, zoom * 0.06);
            ctx.lineJoin = 'round';
            ctx.strokeText(text, mid.x, mid.y);

            // 文字填色 (Fill)
            ctx.fillStyle = this.theme.text_color;
            ctx.fillText(text, mid.x, mid.y);
        }

        // 4. Ports
        this.draw_ports(ctx, this.get_port('input'),  '#38bdf8', '#0284c7', 'I', camera);
        this.draw_ports(ctx, this.get_port('output'), '#f43f5e', '#be123c', 'O', camera);

        ctx.restore();
    }

    private draw_ports
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
            const radius = Math.max(3, camera.zoom * 0.12);

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
 * 固體傳送管
 */
export class solidpipe extends base_ef_pipe
{
    public readonly form:         item_form = 'solid';
    public readonly display_name: string    = '固體管';
    public readonly theme:        ef_pipe_color_theme =
    {
        body_fill:   '#78350f',
        body_stroke: '#f59e0b',
        text_color:  '#fde68a'
    };
}

/**
 * 液體輸送管
 */
export class liquidpipe extends base_ef_pipe
{
    public readonly form:         item_form = 'liquid';
    public readonly display_name: string    = '液體管';
    public readonly theme:        ef_pipe_color_theme =
    {
        body_fill:   '#0369a1',
        body_stroke: '#38bdf8',
        text_color:  '#e0f2fe'
    };
}

/**
 * 氣體輸送管
 */
export class gaspipe extends base_ef_pipe
{
    public readonly form:         item_form = 'gas';
    public readonly display_name: string    = '氣體管';
    public readonly theme:        ef_pipe_color_theme =
    {
        body_fill:   '#065f46',
        body_stroke: '#34d399',
        text_color:  '#d1fae5'
    };
}
