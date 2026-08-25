import type { space, device, vector, namespaced_id, device_constructor } from './types';
import { trigger_create_device, trigger_delete_device, trigger_move_device, trigger_select_recipe } from './hooks';

/**
 * Creates a new space instance with next uid starting from 1.
 */
export function create_space(size: vector): space
{
    return {
        dimension: size.length,
        size,
        uid: 1,
        devices: []
    };
}

// TODO: transitional - remove create_map alias after full migration to create_space
export const create_map = create_space;

/**
 * Adds a device to the space by instantiating from a device constructor.
 * Auto-assigns uid from space.uid and increments it by 1.
 * Modifies the space in place and returns the created device instance.
 */
export function create_device
(
    sp:            space, 
    device_class:  device_constructor,
    definition_id: namespaced_id, 
    position:      vector, 
    other_info:    Record<string, unknown> = {}
): device
{
    const assigned_id = sp.uid;
    const dev = new device_class(assigned_id, definition_id, position, other_info);

    sp.uid += 1;
    sp.devices.push(dev);
    trigger_create_device(sp, dev);
    return dev;
}

/**
 * Restores an existing device instance to the space without reassigning its uid.
 * If dev.uid is >= space.uid, space.uid is updated to dev.uid + 1.
 * Modifies the space in place and triggers create hook.
 */
export function restore_device(sp: space, dev: device): void
{
    const exists = sp.devices.some(d => d.uid === dev.uid);
    if (!exists)
    {
        sp.devices.push(dev);
        if (dev.uid >= sp.uid)
        {
            sp.uid = dev.uid + 1;
        }
        trigger_create_device(sp, dev);
    }
}

/**
 * Removes a device by its uid.
 * Modifies the space in place and returns the removed device instance if found.
 */
export function delete_device(sp: space, device_uid: number): device | undefined
{
    const index = sp.devices.findIndex(d => d.uid === device_uid);
    if (index !== -1)
    {
        const dev = sp.devices[index];
        sp.devices.splice(index, 1);
        trigger_delete_device(sp, dev);
        return dev;
    }
    return undefined;
}

/**
 * Moves a device.
 * Modifies the device in place.
 */
export function move_device(sp: space, device_uid: number, new_position: vector): void
{
    const dev = sp.devices.find(d => d.uid === device_uid);
    if (dev)
    {
        const old_position = dev.position;
        dev.position = new_position;
        trigger_move_device
        (
            sp,
            dev,
            old_position,
            new_position
        );
    }
}

/**
 * Sets or clears the selected recipe for a device.
 * Modifies the device in place.
 */
export function select_recipe(sp: space, device_uid: number, recipe_id?: namespaced_id): void
{
    const dev = sp.devices.find(d => d.uid === device_uid);
    if (dev)
    {
        const old_recipe_id = dev.selected_recipe_id;
        dev.selected_recipe_id = recipe_id;
        trigger_select_recipe
        (
            sp,
            dev,
            old_recipe_id,
            recipe_id
        );
    }
}
