import { type vector } from '@/API';
import { pipe } from '@/packs/pipe';
import type { camera_type, drawable_device } from '@/packs/basic_renderer';
import { get_map } from '@/runtime';
import { vanilla } from '@/packs/vanilla';
import { add_vector } from '@/utils/math';

export const device_id = 'test:pipe';

export class pipe_device extends pipe implements drawable_device
{
    /**
     * Input & output ports situated at pipeline endpoints.
     */
    public get_port(type: 'input' | 'output'): vector[]
    {
        const shape = this.get_shape();
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

            const port: vector = start_cell.map((c, i) =>
            {
                if (i === axis)
                {
                    return sign < 0 ? c : c + 2;
                }
                return c + 1;
            });
            return [port];
        }
        else
        {
            const last_seg = this.segments[this.segments.length - 1];
            const axis = last_seg ? last_seg.axis : 0;
            const sign = last_seg && last_seg.delta < 0 ? -1 : 1;

            const port: vector = end_cell.map((c, i) =>
            {
                if (i === axis)
                {
                    return sign > 0 ? c + 2 : c;
                }
                return c + 1;
            });
            return [port];
        }
    }

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
        };

        const in_ports  = this.get_port('input');
        const out_ports = this.get_port('output');

        render_port_list(in_ports, '#38bdf8', '#0284c7', 'I');
        render_port_list(out_ports, '#f43f5e', '#be123c', 'O');
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

        const fill = '#06b6d4';
        const border = '#0891b2';
        const { dim_h, dim_v, slices } = camera.plane;
        const canvas_height = ctx.canvas.height;
        const shape = this.get_shape();

        const border_lw = Math.max(1, zoom * 0.04);
        const half_border_lw = border_lw / 2;

        const visible_cells: vector[] = [];

        for (const local_cell of shape)
        {
            const wp = add_vector(this.position, local_cell);

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

            visible_cells.push(wp);

            const csx = camera.pan_x + wp[dim_h] * zoom;
            const csy = canvas_height + camera.pan_y - (wp[dim_v] + 2) * zoom;
            const csize = 2 * zoom;

            ctx.fillStyle = fill;
            ctx.fillRect(csx, csy, csize, csize);

            ctx.strokeStyle = border;
            ctx.lineWidth = border_lw;
            ctx.strokeRect(csx + half_border_lw, csy + half_border_lw, csize - border_lw, csize - border_lw);
        }

        if (visible_cells.length > 0)
        {
            const center_cell = visible_cells[Math.floor(visible_cells.length / 2)];
            const label_sx = camera.pan_x + (center_cell[dim_h] + 1) * zoom;
            const label_sy = canvas_height + camera.pan_y - (center_cell[dim_v] + 1) * zoom;

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`#${this.uid}`, label_sx, label_sy);
        }

        this.draw_ports(ctx, camera);

        const map = get_map();
        if (map)
        {
            const validation = vanilla.check_map_overlap(map);
            const overlapped = validation.overlapped.includes(this.uid);
            if (overlapped)
            {
                for (const wp of visible_cells)
                {
                    const csx = camera.pan_x + wp[dim_h] * zoom;
                    const csy = canvas_height + camera.pan_y - (wp[dim_v] + 2) * zoom;
                    const csize = 2 * zoom;

                    ctx.fillStyle = 'rgba(248, 113, 113, 0.45)';
                    ctx.fillRect(csx, csy, csize, csize);

                    const red_lw = Math.max(2, zoom * 0.05);
                    const half_red_lw = red_lw / 2;
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = red_lw;
                    ctx.strokeRect(csx + half_red_lw, csy + half_red_lw, csize - red_lw, csize - red_lw);
                }
            }
        }

        ctx.restore();
    }
}

export default pipe_device;
