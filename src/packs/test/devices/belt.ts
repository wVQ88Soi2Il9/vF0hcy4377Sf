import type { vector } from '@/core/types';
import { base_test_device, type device_color_theme } from './base_test_device';

export const device_id = 'test:belt';

export class belt_device extends base_test_device
{
    public get_shape(): vector[]
    {
        return [[0, 0, 0]];
    }

    public get_port(type: 'input' | 'output'): vector[]
    {
        if (type === 'input')
        {
            return [[0, -1, 0]];
        }
        return [[0, 1, 0]];
    }

    protected get_color_theme(): device_color_theme
    {
        return {
            fill:   '#6b7280',
            border: '#374151'
        };
    }
}

export default belt_device;
