import * as core from '@/core';
import { base_test_device, type device_color_theme } from './base_test_device';

export interface pipe_segment
{
    axis: number;
    delta: number;
}

function get_segments(other_info: Record<string, unknown> | undefined): pipe_segment[]
{
    const value = other_info?.segments;
    if (!Array.isArray(value))
    {
        return [{ axis: 0, delta: 4 }, { axis: 1, delta: 2 }];
    }
    return value.map(segment => segment as Partial<pipe_segment>).map(segment =>
    {
        const axis = segment.axis;
        const delta = segment.delta;
        if (!Number.isSafeInteger(axis) || !Number.isSafeInteger(delta) || delta === undefined || delta === 0 || delta % 2 !== 0)
        {
            throw new Error('Pipe segments require an integer axis and a non-zero even delta.');
        }
        return { axis: axis!, delta };
    });
}

export function segments_to_shape(dimension: number, segments: pipe_segment[]): core.vector[]
{
    const position = Array(dimension).fill(0);
    const shape: core.vector[] = [[...position]];
    for (const segment of segments)
    {
        if (segment.axis < 0 || segment.axis >= dimension)
        {
            throw new Error(`Pipe segment axis ${segment.axis} is outside ${dimension} dimensions.`);
        }
        const step = Math.sign(segment.delta) * 2;
        for (let offset = 0; offset < Math.abs(segment.delta); offset += 2)
        {
            position[segment.axis] += step;
            shape.push([...position]);
        }
    }
    return shape;
}

export class pipe_device extends base_test_device
{
    protected readonly shape: core.vector[];
    protected readonly input_ports: core.vector[];
    protected readonly output_ports: core.vector[];
    protected readonly color: device_color_theme = { fill: '#06b6d4', border: '#0891b2' };

    constructor(device_uid: core.uid, definition_id: core.namespaced_id, position: core.vector, other_info?: Record<string, unknown>)
    {
        super(device_uid, definition_id, position, other_info);
        this.shape = segments_to_shape(position.length, get_segments(other_info));
        const first = this.shape[0];
        const last = this.shape[this.shape.length - 1];
        this.input_ports = [[...first]];
        this.output_ports = [[...last]];
    }
}
