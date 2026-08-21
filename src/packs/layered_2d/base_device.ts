import { device, type vector } from '@/API';
import type { camera_type } from '@/packs/basic_renderer';
import { get_map } from '@/runtime';
import { vanilla } from '@/packs/vanilla';
import type
{
    vector_3d,
    d4_transform,
    rotation_step,
    rotatable_device,
    layered_device,
    drawable_layered_device,
    device_color_theme,
    layered_camera
} from './types';
import { apply_d4_transform, normalize_rotation, is_vector_3d, add_vector_3d } from './math';

/**
 * Common abstract base class for all 2.5D layered devices.
 * Automatically handles D4 dihedral group rotation/flip transformations for shapes & ports,
 * enforces strict 3D vector length [x, y, z], and provides standardized 2.5D rendering.
 */
export abstract class base_layered_device extends device implements drawable_layered_device, rotatable_device
{
    public transform: d4_transform = { rotation: 0, flipped: false };

    /** Base local shape cells (at rotation = 0, flipped = false) */
    protected abstract readonly base_shape: vector_3d[];

    /** Base local input port coordinates */
    protected abstract readonly base_input_ports: vector_3d[];

    /** Base local output port coordinates */
    protected abstract readonly base_output_ports: vector_3d[];

    constructor(uid: number, definition_id: string, position: vector)
    {
        if (!is_vector_3d(position))
        {
            throw new Error(`[layered_2d] Invalid device position: expected 3-element [x, y, z] vector, got ${JSON.stringify(position)}`);
        }
        super(uid, definition_id, position);
    }

    /**
     * Returns the elevation layer index (z coordinate).
     */
    public get_layer(): number
    {
        return this.position[2];
    }

    /**
     * Computes the D4-transformed local shape cells.
     */
    public get_shape(): vector_3d[]
    {
        return this.base_shape.map(v => apply_d4_transform(v, this.transform));
    }

    public get_shape_3d(): vector_3d[]
    {
        return this.get_shape();
    }

    /**
     * Computes the D4-transformed local port coordinates.
     */
    public get_port(type: 'input' | 'output'): vector_3d[]
    {
        const ports = type === 'input' ? this.base_input_ports : this.base_output_ports;
        return ports.map(v => apply_d4_transform(v, this.transform));
    }

    public get_port_3d(type: 'input' | 'output'): vector_3d[]
    {
        return this.get_port(type);
    }

    /**
     * Rotates device by `steps` 90° counter-clockwise increments.
     */
    public rotate(steps: number = 1): void
    {
        this.transform.rotation = normalize_rotation(this.transform.rotation + steps);
    }

    /**
     * Flips device across the horizontal axis (y -> -y).
     */
    public flip(): void
    {
        this.transform.flipped = !this.transform.flipped;
    }

    /**
     * Sets the full D4 transformation state directly.
     */
    public set_transform(transform: d4_transform): void
    {
        this.transform = {
            rotation: normalize_rotation(transform.rotation),
            flipped:  Boolean(transform.flipped)
        };
    }

    /**
     * Provides default or customizable color palette for this device.
     */
    protected get_color_theme(camera?: camera_type): device_color_theme
    {
        return {
            fill:   '#38bdf8',
            border: '#0284c7'
        };
    }

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
            ports:        vector_3d[],
            color:        string,
            border_color: string,
            label:        string
        ): void =>
        {
            for (const local_port of ports)
            {
                const wp = add_vector_3d(this.position as vector_3d, local_port);

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
     * Draws directional D4 orientation indicator inside the device cell.
     */
    protected draw_orientation_indicator(ctx: CanvasRenderingContext2D, sx: number, sy: number, sw: number, sh: number, zoom: number): void
    {
        const cx = sx + sw / 2;
        const cy = sy + sh / 2;
        const len = Math.max(4, zoom * 0.25);

        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.5, zoom * 0.04);
        ctx.beginPath();

        // 0: 右(+X), 1: 上(+Y in math / screen up is -Y), 2: 左(-X), 3: 下(-Y in math / screen down is +Y)
        let dx = 0;
        let dy = 0;
        switch (this.transform.rotation)
        {
            case 0: dx =  len; dy =  0;   break;
            case 1: dx =  0;   dy = -len; break;
            case 2: dx = -len; dy =  0;   break;
            case 3: dx =  0;   dy =  len; break;
        }

        ctx.moveTo(cx - dx * 0.5, cy - dy * 0.5);
        ctx.lineTo(cx + dx * 0.5, cy + dy * 0.5);
        ctx.stroke();

        // Arrow tip
        ctx.beginPath();
        ctx.arc(cx + dx * 0.5, cy + dy * 0.5, Math.max(2, zoom * 0.06), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Standard device rendering compatible with basic_renderer.
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
        ctx.globalAlpha = 0.8;

        const { fill, border } = this.get_color_theme(camera);

        // 1. Fill base rect
        ctx.fillStyle = fill;
        ctx.fillRect(sx, sy, sw, sh);

        // 2. Inner border
        const border_lw = Math.max(1, zoom * 0.04);
        const half_border_lw = border_lw / 2;
        ctx.strokeStyle = border;
        ctx.lineWidth = border_lw;
        ctx.strokeRect(sx + half_border_lw, sy + half_border_lw, sw - border_lw, sh - border_lw);

        // 3. Orientation indicator
        this.draw_orientation_indicator(ctx, sx, sy, sw, sh, zoom);

        // 4. Device #UID and Layer label
        ctx.fillStyle = border;
        ctx.font = `bold ${Math.max(8, zoom * 0.25)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${this.uid}`, sx + sw / 2, sy + sh * 0.25);

        // 5. Ports
        this.draw_ports(ctx, camera);

        // 6. Overlap detection alert
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
