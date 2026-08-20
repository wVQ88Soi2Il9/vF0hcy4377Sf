import type { vector } from '@/API';
import { base_test_device, type device_color_theme } from './base_test_device';

export const device_id = 'test:splitter';

export class splitter_device extends base_test_device
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
        return [
            [-1, 0, 0],
            [1, 0, 0],
            [0, 1, 0]
        ];
    }

    protected get_color_theme(): device_color_theme
    {
        return {
            fill:   '#f97316',
            border: '#c2410c'
        };
    }
}

export default splitter_device;
