import type { game_map, device, vector, rotation } from '@/core/types'
import { trigger_create_device, trigger_delete_device, trigger_move_device, trigger_rotate_device } from '@/core/hooks'

/**
 * Adds a device to the map.
 * Modifies the map in place.
 */
export function create_device(map: game_map, dev: device): void
{
    map.devices.push(dev)
    trigger_create_device(map, dev)
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
        const dev = map.devices[index]
        map.devices.splice(index, 1)
        trigger_delete_device(map, dev)
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
        const old_position = dev.position
        dev.position = new_position
        trigger_move_device(
            map,
            dev,
            old_position,
            new_position
        )
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
        const old_rotation = dev.rotation
        dev.rotation = new_rotation
        trigger_rotate_device(
            map,
            dev,
            old_rotation,
            new_rotation
        )
    }
}
