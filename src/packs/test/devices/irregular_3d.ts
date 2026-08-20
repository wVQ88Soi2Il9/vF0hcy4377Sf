import type { vector } from '@/core/types';
import { base_test_device, type device_color_theme } from './base_test_device';

export const device_id = 'test:irregular_3d';

export class irregular_3d_device extends base_test_device
{
    public get_shape(): vector[]
    {
        return [
            [0, 0, 0],
            [2, 0, 0],
            [0, 2, 0],
            [0, 0, 2],
            [2, 2, 2]
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
            [2, 2, 3]
        ];
    }

    protected get_color_theme(): device_color_theme
    {
        return {
            fill:   '#a855f7',
            border: '#7e22ce'
        };
    }
}

export default irregular_3d_device;
