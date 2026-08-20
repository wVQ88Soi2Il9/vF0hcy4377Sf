import type { vector } from '@/core/types';
import type { camera_type } from '@/packs/basic_renderer';
import { base_test_device } from './base_test_device';

export const device_id = 'test:assembler';

export class assembler_device extends base_test_device
{
    public get_shape(): vector[]
    {
        return [
            [0, 0, 0],
            [2, 0, 0],
            [0, 2, 0],
            [2, 2, 0]
        ];
    }

    public get_port(type: 'input' | 'output'): vector[]
    {
        if (type === 'input')
        {
            return [[-1, 0, 0]];
        }
        return [
            [3, 0, 0],
            [3, 2, 0]
        ];
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
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(sx, sy, sw, sh);

        ctx.strokeStyle = '#4a90d9';
        ctx.lineWidth = Math.max(1, zoom * 0.04);
        ctx.strokeRect(sx, sy, sw, sh);

        const uid_text = `#${this.uid}`;

        ctx.fillStyle = '#4a90d9';
        ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(uid_text, sx + sw / 2, sy + sh / 2);

        this.draw_ports(ctx, camera);
    }
}

export default assembler_device;
