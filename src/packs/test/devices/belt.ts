import { device_definition_base } from '@/API';

export class belt_device extends device_definition_base
{
    constructor()
    {
        super
        (
            'belt',
            [
                [0, 0, 0]
            ],
            [
                [0, -1, 0]
            ],
            [
                [0, 1, 0]
            ],
            {}
        );
    }
}

export const device = new belt_device();
export default device;
