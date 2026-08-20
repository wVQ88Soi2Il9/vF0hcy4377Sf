import { device_definition_base } from '@/API';

export class splitter_device extends device_definition_base
{
    constructor()
    {
        super
        (
            'splitter',
            [
                [0, 0, 0]
            ],
            [
                [0, -1, 0]
            ],
            [
                [-1, 0, 0],
                [1, 0, 0],
                [0, 1, 0]
            ],
            {}
        );
    }
}

export const device = new splitter_device();
export default device;
