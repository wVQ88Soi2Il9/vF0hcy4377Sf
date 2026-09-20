import { base_test_device, type device_color_theme } from './base_test_device';

export class splitter_device extends base_test_device
{
    protected readonly shape = [[0, 0, 0], [0, 2, 0]];
    protected readonly input_ports = [[0, 1, 1]];
    protected readonly output_ports = [[2, 1, 1], [2, 3, 1]];
    protected readonly color: device_color_theme = { fill: '#f97316', border: '#c2410c' };
}
