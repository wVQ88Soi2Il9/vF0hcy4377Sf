import type { device, vector, device_definition } from '../core/types'
import { add_vector, rotate_vector_3d } from './math'

/**
 * Gets the world coordinates of all cells occupied by a device.
 */
export function get_world_cells(dev: device, def: device_definition): vector[]
{
    return def.positions.map(pos => 
        add_vector(dev.start_point, rotate_vector_3d(pos, dev.rotation))
    )
}

/**
 * Gets the world coordinates of the device's ports.
 */
export function get_world_ports(dev: device, def: device_definition, type: 'input' | 'output'): vector[]
{
    const ports = type === 'input' ? def.input_ports : def.output_ports
    return ports.map(port => 
        add_vector(dev.start_point, rotate_vector_3d(port, dev.rotation))
    )
}
