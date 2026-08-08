import type { vector, device, game_map } from './types'
import { get_world_cells } from './geometry'

/** Compare two vector for equality. */
function vector_eq(a: vector, b: vector): boolean
{
  return a.x === b.x && a.y === b.y && a.z === b.z
}

/** Check whether a world cell falls within map bounds. */
function in_bounds(map: game_map, cell: vector): boolean
{
  return (
    cell.x >= 0 && cell.x < map.size.x &&
    cell.y >= 0 && cell.y < map.size.y &&
    cell.z >= 0 && cell.z < map.size.z
  )
}

/**
 * Returns true if the given world cell is occupied by any device.
 */
export function is_cell_occupied(map: game_map, cell: vector): boolean
{
  return map.devices.some(d =>
    get_world_cells(d).some(c => vector_eq(c, cell))
  )
}

/**
 * Returns the device whose world cells include the given cell, or null.
 */
export function get_device_at(map: game_map, cell: vector): device | null
{
  return map.devices.find(d =>
    get_world_cells(d).some(c => vector_eq(c, cell))
  ) ?? null
}

/**
 * Attempt to place a device on the map.
 * Returns false (and does NOT mutate) if any cell is out of bounds or already occupied.
 */
export function place_device(map: game_map, d: device): boolean
{
  const cells = get_world_cells(d)

  for (const cell of cells)
  {
    if (!in_bounds(map, cell)) return false
    if (is_cell_occupied(map, cell)) return false
  }

  map.devices.push(d)
  return true
}

/**
 * Remove the device with the given id from the map.
 * Returns false if no such device exists.
 */
export function remove_device(map: game_map, id: string): boolean
{
  const idx = map.devices.findIndex(d => d.id === id)
  if (idx === -1) return false
  map.devices.splice(idx, 1)
  return true
}
