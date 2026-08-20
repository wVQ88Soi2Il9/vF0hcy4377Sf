import type { vector } from '@/core/types';
import { base_test_device, type device_color_theme } from './base_test_device';

export const device_id = 'test:merger';

export class merger_device extends base_test_device
{
    public get_shape(): vector[]
    {
        return [[0, 0, 0]];
    }

    public get_port(type: 'input' | 'output'): vector[]
    {
        if (type === 'input')
        {
            return [
                [-1, 0, 0],
                [1, 0, 0],
                [0, -1, 0]
            ];
        }
        return [[0, 1, 0]];
    }

    protected get_color_theme(): device_color_theme
    {
        return {
            fill:   '#22c55e',
            border: '#15803d'
        };
    }
}

export default merger_device;
