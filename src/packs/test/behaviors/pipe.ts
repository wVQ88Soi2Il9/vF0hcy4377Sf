import { device_behavior, type device, type device_definition, type vector } from '@/API';

/**
 * Pipe OOP Device Behavior
 * Dynamically scales shape cells and ports based on device.other_info.length.
 */
export class pipe_behavior extends device_behavior
{
    /**
     * Calculates variable shape cells along X axis according to other_info.length
     */
    public override get_shape(dev: device, def: device_definition): vector[]
    {
        const len = typeof dev?.other_info?.length === 'number' ? Math.max(1, dev.other_info.length) : 1;
        const cells: vector[] = [];
        for (let i = 0; i < len; i++)
        {
            cells.push([i * 2, 0, 0]);
        }
        return cells;
    }

    /**
     * Calculates input port at the start of the pipe
     */
    public override get_input_ports(dev: device, def: device_definition): vector[]
    {
        return [[-1, 0, 0]];
    }

    /**
     * Calculates output port dynamically at the end of the extended pipe
     */
    public override get_output_ports(dev: device, def: device_definition): vector[]
    {
        const len = typeof dev?.other_info?.length === 'number' ? Math.max(1, dev.other_info.length) : 1;
        const tail_port_x = (len - 1) * 2 + 1;
        return [[tail_port_x, 0, 0]];
    }

    /**
     * Resizes pipe length
     */
    public resize(dev: device, new_length: number): void
    {
        if (!dev.other_info)
        {
            dev.other_info = {};
        }
        dev.other_info.length = Math.max(1, Math.floor(new_length));
    }

    /**
     * Lifecycle hook when pipe is placed on map
     */
    public override on_place(dev: device, def: device_definition): void
    {
        if (dev.other_info && typeof dev.other_info.length !== 'number')
        {
            dev.other_info.length = 1;
        }
    }
}

export const device_id = 'test:pipe';
export const behavior = new pipe_behavior();
