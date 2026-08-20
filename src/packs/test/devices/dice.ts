import { device_definition_base } from '@/API';

export class dice_device extends device_definition_base
{
    constructor()
    {
        super
        (
            'dice',
            [
                [0, 0, 0]
            ],
            [
                [-1, 0, 0],
                [0, -1, 0]
            ],
            [
                [1, 0, 0],
                [0, 1, 0]
            ],
            {}
        );
    }
}

export const device = new dice_device();
export default device;
