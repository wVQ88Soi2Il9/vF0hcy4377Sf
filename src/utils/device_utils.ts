import type { device, vector, device_definition } from '@/core/types';
import { get_device_behavior } from '@/core/device_behavior';

/**
 * Gets the world coordinates of all cells occupied by a device.
 */
export function get_world_cells(dev: device, def: device_definition): vector[]
{
    return get_device_behavior(def.id).get_world_cells(dev, def);
}

/**
 * Gets the world coordinates of the device's ports.
 */
export function get_world_ports(dev: device, def: device_definition, type: 'input' | 'output'): vector[]
{
    return get_device_behavior(def.id).get_world_ports(dev, def, type);
}

