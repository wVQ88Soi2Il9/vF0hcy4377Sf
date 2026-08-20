import type { device, device_definition, vector } from '@/core/types';
import type { camera_type } from '@/packs/basic_renderer/types';
import { get_world_ports } from '@/utils/device_utils';

/**
 * Draws input and output ports on canvas for an ef pack device.
 */
export function draw_ports
(
    ctx:     CanvasRenderingContext2D,
    device:  device,
    def:     device_definition,
    camera?: camera_type
): void
{
    if (!camera)
    {
        return;
    }

    const { dim_h, dim_v, slices } = camera.plane;
    const canvas_height = ctx.canvas.height;

    function render_port_list
    (
        ports:        vector[],
        color:        string,
        border_color: string,
        label:        string
    ): void
    {
        for (const wp of ports)
        {
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

            const port_sx = camera!.pan_x + (wp[dim_h] + 1) * camera!.zoom;
            const port_sy = canvas_height + camera!.pan_y - (wp[dim_v] + 1) * camera!.zoom;
            const radius  = Math.max(3, camera!.zoom * 0.12);

            ctx.beginPath();
            ctx.arc(port_sx, port_sy, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = border_color;
            ctx.lineWidth = Math.max(1, camera!.zoom * 0.03);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(6, camera!.zoom * 0.12)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, port_sx, port_sy);
        }
    }

    const input_world_ports  = get_world_ports(device, def, 'input');
    const output_world_ports = get_world_ports(device, def, 'output');

    render_port_list(input_world_ports, '#38bdf8', '#0284c7', 'I');
    render_port_list(output_world_ports, '#f43f5e', '#be123c', 'O');
}
