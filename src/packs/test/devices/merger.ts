import { device_definition_base } from '@/API';

export class merger_device extends device_definition_base
{
    constructor()
    {
        super
        (
            'merger',
            [
                [0, 0, 0]
            ],
            [
                [-1, 0, 0],
                [1, 0, 0],
                [0, -1, 0]
            ],
            [
                [0, 1, 0]
            ],
            {}
        );
    }
}

export const device = new merger_device();
export default device;
