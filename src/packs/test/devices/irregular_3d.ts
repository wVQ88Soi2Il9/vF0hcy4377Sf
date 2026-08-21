import type { vector_3d } from '@/packs/layered_2d';
import { base_test_device, type device_color_theme } from './base_test_device';

export const device_id = 'test:irregular_3d';

export class irregular_3d_device extends base_test_device
{
    protected readonly base_shape: vector_3d[] = [
        [0, 0, 0],
        [2, 0, 0],
        [0, 2, 0],
        [0, 0, 2],
        [2, 2, 2]
    ];

    protected readonly base_input_ports: vector_3d[] = [
        [0, 1, 1]
    ];

    protected readonly base_output_ports: vector_3d[] = [
        [4, 1, 1],
        [3, 3, 4]
    ];

    protected get_color_theme(): device_color_theme
    {
        return {
            fill:   '#a855f7',
            border: '#7e22ce'
        };
    }
}

export default irregular_3d_device;
