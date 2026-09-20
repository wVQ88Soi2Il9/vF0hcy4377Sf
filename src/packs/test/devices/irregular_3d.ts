import { base_test_device, type device_color_theme } from './base_test_device';

export class irregular_3d_device extends base_test_device
{
    protected readonly shape = [[0, 0, 0], [2, 0, 0], [0, 2, 0], [0, 0, 2], [2, 2, 2]];
    protected readonly input_ports = [[0, 1, 1]];
    protected readonly output_ports = [[4, 1, 1], [3, 3, 4]];
    protected readonly color: device_color_theme = { fill: '#a855f7', border: '#7e22ce' };
}
