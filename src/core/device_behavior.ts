import type { device, device_definition, vector } from './types';
import { add_vector, rotate_vector } from '@/utils/math';

/**
 * Abstract base class defining the behavior contract for a device.
 * Encapsulates dynamic geometry (shape, ports), lifecycle hooks, and logic.
 */
export abstract class device_behavior
{
    /**
     * Calculates the local shape cells for a given device instance.
     * Default implementation falls back to static definition shape.
     */
    public get_shape(_dev: device, def: device_definition): vector[]
    {
        return def.shape;
    }

    /**
     * Calculates the local input port offsets for a given device instance.
     * Default implementation falls back to static definition input_ports.
     */
    public get_input_ports(_dev: device, def: device_definition): vector[]
    {
        return def.input_ports;
    }

    /**
     * Calculates the local output port offsets for a given device instance.
     * Default implementation falls back to static definition output_ports.
     */
    public get_output_ports(_dev: device, def: device_definition): vector[]
    {
        return def.output_ports;
    }

    /**
     * Calculates the world coordinates of all cells occupied by this device.
     */
    public get_world_cells(dev: device, def: device_definition): vector[]
    {
        const shape = this.get_shape(dev, def);
        return shape.map(pos =>
            add_vector(dev.position, rotate_vector(pos, dev.rotation))
        );
    }

    /**
     * Calculates the world coordinates of the device's ports.
     */
    public get_world_ports(dev: device, def: device_definition, type: 'input' | 'output'): vector[]
    {
        const ports = type === 'input' ? this.get_input_ports(dev, def) : this.get_output_ports(dev, def);
        return ports.map(port =>
            add_vector(dev.position, rotate_vector(port, dev.rotation))
        );
    }

    /**
     * Optional hook called when device is created / placed on the map.
     */
    public on_place?(dev: device, def: device_definition): void;

    /**
     * Optional hook called when device is removed from the map.
     */
    public on_remove?(dev: device, def: device_definition): void;
}

/**
 * Default standard device behavior for purely static devices.
 */
export class default_device_behavior extends device_behavior
{
}

const default_instance = new default_device_behavior();
const behavior_map = new Map<string, device_behavior>();

export function register_device_behavior(definition_id: string, behavior: device_behavior): void
{
    behavior_map.set(definition_id, behavior);
}

export function get_device_behavior(definition_id: string): device_behavior
{
    return behavior_map.get(definition_id) || default_instance;
}
