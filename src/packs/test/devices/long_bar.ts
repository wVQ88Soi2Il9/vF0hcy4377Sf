import type { vector } from '@/API';
import type { camera_type } from '@/packs/basic_renderer';
import { base_test_device, type device_color_theme } from './base_test_device';

export const device_id = 'test:long_bar';

const slice_palettes: device_color_theme[] = [
    { fill: '#f43f5e', border: '#9f1239' },
    { fill: '#34d399', border: '#047857' },
    { fill: '#a78bfa', border: '#5b21b6' }
];

export class long_bar_device extends base_test_device
{
    public get_shape(): vector[]
    {
        return [
            [0, 0, 0],
            [2, 0, 0],
            [4, 0, 0],
            [6, 0, 0],
            [8, 0, 0],
            [0, 0, 2],
            [2, 0, 2],
            [4, 0, 2],
            [6, 0, 2],
            [8, 0, 2],
            [0, 0, 4],
            [2, 0, 4],
            [4, 0, 4],
            [6, 0, 4],
            [8, 0, 4]
        ];
    }

    public get_port(type: 'input' | 'output'): vector[]
    {
        if (type === 'input')
        {
            return [[-1, 0, 0]];
        }
        return [[9, 0, 0]];
    }

    protected get_color_theme(camera?: camera_type): device_color_theme
    {
        let palette_idx = 0;
        if (camera)
        {
            const { dim_h, dim_v, slices } = camera.plane;
            for (let i = 0; i < slices.length; i++)
            {
                if (i !== dim_h && i !== dim_v)
                {
                    palette_idx = Math.max(0, Math.floor(slices[i] / 2));
                    break;
                }
            }
        }
        return slice_palettes[palette_idx % slice_palettes.length];
    }
}

export default long_bar_device;
