import { device_definition_base } from '@/API';

export class assembler_device extends device_definition_base
{
    constructor()
    {
        super
        (
            'assembler',
            [
                [0, 0, 0],
                [2, 0, 0],
                [0, 2, 0],
                [2, 2, 0]
            ],
            [
                [-1, 0, 0]
            ],
            [
                [3, 0, 0],
                [3, 2, 0]
            ],
            {}
        );
    }
}

export const device = new assembler_device();
export default device;
