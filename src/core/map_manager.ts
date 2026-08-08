import type { game_map, device, vector, rotation } from './types'

/**
 * Adds a device to the map.
 * Modifies the map in place.
 */
export function create_device(map: game_map, dev: device): void
{
    map.devices.push(dev)
}

/**
 * Removes a device from the map by its ID.
 * Modifies the map in place.
 */
export function delete_device(map: game_map, device_id: string): void
{
    const index = map.devices.findIndex(d => d.id === device_id)
    if (index !== -1)
    {
        map.devices.splice(index, 1)
    }
}

/**
 * Moves a device to a new start point.
 * Modifies the device in place.
 */
export function move_device(map: game_map, device_id: string, new_start_point: vector): void
{
    const dev = map.devices.find(d => d.id === device_id)
    if (dev)
    {
        dev.start_point = new_start_point
    }
}

/**
 * Rotates a device to a new rotation.
 * Modifies the device in place.
 */
export function rotate_device(map: game_map, device_id: string, new_rotation: rotation): void
{
    const dev = map.devices.find(d => d.id === device_id)
    if (dev)
    {
        dev.rotation = new_rotation
    }
}
