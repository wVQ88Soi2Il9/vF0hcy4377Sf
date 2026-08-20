import type { vector } from '@/core/types';
import { base_test_device, type device_color_theme } from './base_test_device';

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

    protected get_color_theme(): device_color_theme
    {
        return {
            fill:   '#3b82f6',
            border: '#1d4ed8'
        };
    }
}

export default assembler_device;
