import type { vector_3d } from '@/packs/layered_2d';
import { base_test_device, type device_color_theme } from './base_test_device';

export const device_id = 'test:assembler';

export class assembler_device extends base_test_device
{
    protected readonly base_shape: vector_3d[] = [
        [0, 0, 0],
        [2, 0, 0],
        [0, 2, 0],
        [2, 2, 0]
    ];

    protected readonly base_input_ports: vector_3d[] = [
        [-1, 0, 0]
    ];

    protected readonly base_output_ports: vector_3d[] = [
        [3, 0, 0],
        [3, 2, 0]
    ];

    protected get_color_theme(): device_color_theme
    {
        return {
            fill:   '#3b82f6',
            border: '#1d4ed8'
        };
    }
}

export default assembler_device;
