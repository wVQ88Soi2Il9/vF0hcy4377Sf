import type { game_map, device, vector, rotation } from '@/core/types';
import { trigger_create_device, trigger_delete_device, trigger_move_device, trigger_rotate_device } from '@/core/hooks';

/**
 * Creates a new map instance with next_unique_id starting from 0.
 */
export function create_map(size: vector): game_map
{
    return {
        size,
        unique_id: 0,
        devices: []
    };
}

/**
 * Adds a device to the map.
 * Auto-assigns unique_id from map.unique_id and increments it by 1.
 * Modifies the map in place and returns the created device instance.
 */
export function create_device
(
    map: game_map, 
    definition_id: string, 
    position: vector, 
    rotation: rotation, 
    other_info: Record<string, unknown> = {}
): device
{
    const assigned_id = map.unique_id;

    const dev: device = 
    {   
        unique_id: assigned_id,
        definition_id: definition_id,
        position: position,
        rotation: rotation,
        other_info: other_info
    };

    map.unique_id += 1;
    map.devices.push(dev);
    trigger_create_device(map, dev);
    return dev;
}

/**
 * Removes a device by its unique_id.
 * Modifies the map in place.
 */
export function delete_device(map: game_map, device_unique_id: number): void
{
    const index = map.devices.findIndex(d => d.unique_id === device_unique_id);
    if (index !== -1)
    {
        const dev = map.devices[index];
        map.devices.splice(index, 1);
        trigger_delete_device(map, dev);
    }
}

/**
 * Moves a device.
 * Modifies the device in place.
 */
export function move_device(map: game_map, device_unique_id: number, new_position: vector): void
{
    const dev = map.devices.find(d => d.unique_id === device_unique_id);
    if (dev)
    {
        const old_position = dev.position;
        dev.position = new_position;
        trigger_move_device
        (
            map,
            dev,
            old_position,
            new_position
        );
    }
}

/**
 * Rotates a device.
 * Modifies the device in place.
 */
export function rotate_device(map: game_map, device_unique_id: number, new_rotation: rotation): void
{
    const dev = map.devices.find(d => d.unique_id === device_unique_id);
    if (dev)
    {
        const old_rotation = dev.rotation;
        dev.rotation = new_rotation;
        trigger_rotate_device(
            map,
            dev,
            old_rotation,
            new_rotation
        );
    }
}
