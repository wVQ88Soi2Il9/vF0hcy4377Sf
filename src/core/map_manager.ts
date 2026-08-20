import type { game_map, vector, rotation } from '@/core/types';
import { device } from '@/core/types';
import { trigger_create_device, trigger_delete_device, trigger_move_device, trigger_rotate_device, trigger_select_recipe } from '@/core/hooks';

/**
 * Creates a new map instance with next uid starting from 1.
 */
export function create_map(size: vector): game_map
{
    return {
        size,
        uid: 1,
        devices: []
    };
}

/**
 * Adds a device to the map.
 * Auto-assigns uid from map.uid and increments it by 1.
 * Modifies the map in place and returns the created device instance.
 */
export function create_device
(
    map:           game_map, 
    definition_id: string, 
    position:      vector, 
    rotation:      rotation = [], 
    other_info:    Record<string, unknown> = {}
): device
{
    const assigned_id = map.uid;

    const dev = new device
    (
        assigned_id,
        definition_id,
        position,
        rotation,
        other_info
    );

    map.uid += 1;
    map.devices.push(dev);
    trigger_create_device(map, dev);
    return dev;
}

/**
 * Removes a device by its uid.
 * Modifies the map in place.
 */
export function delete_device(map: game_map, device_uid: number): void
{
    const index = map.devices.findIndex(d => d.uid === device_uid);
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
export function move_device(map: game_map, device_uid: number, new_position: vector): void
{
    const dev = map.devices.find(d => d.uid === device_uid);
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
export function rotate_device(map: game_map, device_uid: number, new_rotation: rotation): void
{
    const dev = map.devices.find(d => d.uid === device_uid);
    if (dev)
    {
        const old_rotation = dev.rotation;
        dev.rotation = new_rotation;
        trigger_rotate_device
        (
            map,
            dev,
            old_rotation,
            new_rotation
        );
    }
}

/**
 * Sets or clears the selected recipe for a device.
 * Modifies the device in place.
 */
export function select_recipe(map: game_map, device_uid: number, recipe_id?: string): void
{
    const dev = map.devices.find(d => d.uid === device_uid);
    if (dev)
    {
        const old_recipe_id = dev.selected_recipe_id;
        dev.selected_recipe_id = recipe_id;
        trigger_select_recipe
        (
            map,
            dev,
            old_recipe_id,
            recipe_id
        );
    }
}
