import type { vector_3d } from '@/packs/layered_2d';
import { base_test_device, type device_color_theme } from './base_test_device';

export const device_id = 'test:merger';

export class merger_device extends base_test_device
{
    protected readonly base_shape: vector_3d[] = [
        [0, 0, 0],
        [0, 2, 0]
    ];

    protected readonly base_input_ports: vector_3d[] = [
        [0, 1, 1],
        [0, 3, 1]
    ];

    protected readonly base_output_ports: vector_3d[] = [
        [2, 1, 1]
    ];

    protected get_color_theme(): device_color_theme
    {
        return {
            fill:   '#22c55e',
            border: '#15803d'
        };
    }
}

export default merger_device;
