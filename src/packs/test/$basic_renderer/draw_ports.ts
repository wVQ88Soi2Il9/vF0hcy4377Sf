import type { device, device_definition, vector } from '@/API';
import type { camera_type } from '@/packs/basic_renderer/types';
import { get_world_ports } from '@/utils/device_utils';

/**
 * Draws input and output ports on canvas for a test pack device.
 */
export function draw_ports
(
    ctx:    CanvasRenderingContext2D,
    device: device,
    def:    device_definition,
    camera?: camera_type
): void
{
    if (!camera)
    {
        return;
    }

    const { dim_h, dim_v } = camera.plane;

    const in_ports = get_world_ports(device, def, 'input');
    const out_ports = get_world_ports(device, def, 'output');

    function draw_port_marker(port_pos: vector, color: string): void
    {
        const h = port_pos[dim_h];
        const v = port_pos[dim_v];

        const cx = camera!.pan_x + (h + 1) * camera!.zoom;
        const cy = ctx.canvas.height + camera!.pan_y - (v + 1) * camera!.zoom;
        const radius = Math.max(3, camera!.zoom * 0.15);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, camera!.zoom * 0.03);
        ctx.stroke();
    }

    // Draw inputs (cyan)
    for (const port of in_ports)
    {
        draw_port_marker(port, '#00d2d3');
    }

    // Draw outputs (orange)
    for (const port of out_ports)
    {
        draw_port_marker(port, '#ff9f43');
    }
}
