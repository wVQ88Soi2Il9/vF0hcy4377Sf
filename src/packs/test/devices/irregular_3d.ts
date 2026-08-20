import { device_definition_base } from '@/API';

export class irregular_3d_device extends device_definition_base
{
    constructor()
    {
        super
        (
            'irregular_3d',
            [
                [0, 0, 0],
                [2, 0, 0],
                [0, 2, 0],
                [0, 0, 2],
                [2, 2, 2]
            ],
            [
                [-1, 0, 0]
            ],
            [
                [3, 0, 0],
                [2, 2, 3]
            ],
            {}
        );
    }
}

export const device = new irregular_3d_device();
export default device;
