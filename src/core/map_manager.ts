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
 * Removes a device by its unique_id.
 * Modifies the map in place.
 */
export function delete_device(map: game_map, device_unique_id: number): void
{
    const index = map.devices.findIndex(d => d.unique_id === device_unique_id)
    if (index !== -1)
    {
        map.devices.splice(index, 1)
    }
}

/**
 * Moves a device.
 * Modifies the device in place.
 */
export function move_device(map: game_map, device_unique_id: number, new_position: vector): void
{
    const dev = map.devices.find(d => d.unique_id === device_unique_id)
    if (dev)
    {
        dev.position = new_position
    }
}

/**
 * Rotates a device.
 * Modifies the device in place.
 */
export function rotate_device(map: game_map, device_unique_id: number, new_rotation: rotation): void
{
    const dev = map.devices.find(d => d.unique_id === device_unique_id)
    if (dev)
    {
        dev.rotation = new_rotation
    }
}
