import type { vector, device } from './types'
import { rotate_vector } from './rotate'

/** Add two vector (used to apply start_point offset). */
function add_vector(a: vector, b: vector): vector
{
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

/**
 * Convert a local offset array to world coordinates:
 * world = start_point + rotate(local, rotation)
 */
function to_world(locals: vector[], d: device): vector[]
{
  return locals.map(local =>
    add_vector(d.start_point, rotate_vector(local, d.rotation))
  )
}

/**
 * Returns all world cells occupied by this device.
 */
export function get_world_cells(d: device): vector[]
{
  return to_world(d.positions, d)
}

/**
 * Returns all world positions of this device's input ports.
 */
export function get_world_input_ports(d: device): vector[]
{
  return to_world(d.input_ports, d)
}

/**
 * Returns all world positions of this device's output ports.
 */
export function get_world_output_ports(d: device): vector[]
{
  return to_world(d.output_ports, d)
}
