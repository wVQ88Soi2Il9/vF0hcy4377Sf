import type { game_map, device, vector, rotation } from '@/core/types';
import { device_instance } from '@/core/types';
import { trigger_create_device, trigger_delete_device, trigger_move_device, trigger_rotate_device, trigger_select_recipe } from '@/core/hooks';

/**
 * OOP Game Map class managing placed device instances and spatial state.
 */
export class game_map_instance implements game_map
{
    public size:    vector;
    public uid:     number;
    public devices: device[];

    constructor(size: vector, uid: number = 1, devices: device[] = [])
    {
        this.size    = size;
        this.uid     = uid;
        this.devices = devices;
    }

    /**
     * Adds a device to the map.
     * Auto-assigns uid and increments next uid counter.
     */
    public create_device
    (
        definition_id: string,
        position:      vector,
        rotation:      rotation = [],
        other_info:    Record<string, unknown> = {}
    ): device
    {
        const assigned_id = this.uid;
        const dev = new device_instance(assigned_id, definition_id, position, rotation, other_info);

        this.uid += 1;
        this.devices.push(dev);
        trigger_create_device(this, dev);
        return dev;
    }

    /**
     * Removes a device by its uid.
     */
    public delete_device(device_uid: number): device | undefined
    {
        const index = this.devices.findIndex(d => d.uid === device_uid);
        if (index !== -1)
        {
            const dev = this.devices[index];
            this.devices.splice(index, 1);
            trigger_delete_device(this, dev);
            return dev;
        }
        return undefined;
    }

    /**
     * Moves a device to a new position.
     */
    public move_device(device_uid: number, new_position: vector): void
    {
        const dev = this.devices.find(d => d.uid === device_uid);
        if (dev)
        {
            const old_position = dev.position;
            if (dev instanceof device_instance)
            {
                dev.move(new_position);
            }
            else
            {
                dev.position = new_position;
            }
            trigger_move_device(this, dev, old_position, new_position);
        }
    }

    /**
     * Rotates a device.
     */
    public rotate_device(device_uid: number, new_rotation: rotation): void
    {
        const dev = this.devices.find(d => d.uid === device_uid);
        if (dev)
        {
            const old_rotation = dev.rotation;
            if (dev instanceof device_instance)
            {
                dev.rotate(new_rotation);
            }
            else
            {
                dev.rotation = new_rotation;
            }
            trigger_rotate_device(this, dev, old_rotation, new_rotation);
        }
    }

    /**
     * Sets or clears the selected recipe for a device.
     */
    public select_recipe(device_uid: number, recipe_id?: string): void
    {
        const dev = this.devices.find(d => d.uid === device_uid);
        if (dev)
        {
            const old_recipe_id = dev.selected_recipe_id;
            if (dev instanceof device_instance)
            {
                dev.select_recipe(recipe_id);
            }
            else
            {
                dev.selected_recipe_id = recipe_id;
            }
            trigger_select_recipe(this, dev, old_recipe_id, recipe_id);
        }
    }

    /**
     * Finds a device by uid.
     */
    public get_device(device_uid: number): device | undefined
    {
        return this.devices.find(d => d.uid === device_uid);
    }
}

/**
 * Procedural API delegates (delegating directly to game_map_instance).
 */
export const create_map = (size: vector): game_map => new game_map_instance(size);

export const create_device =
(
    map:           game_map,
    definition_id: string,
    position:      vector,
    rotation:      rotation = [],
    other_info:    Record<string, unknown> = {}
): device => (map as game_map_instance).create_device(definition_id, position, rotation, other_info);

export const delete_device = (map: game_map, device_uid: number): device | undefined =>
    (map as game_map_instance).delete_device(device_uid);

export const move_device = (map: game_map, device_uid: number, new_position: vector): void =>
    (map as game_map_instance).move_device(device_uid, new_position);

export const rotate_device = (map: game_map, device_uid: number, new_rotation: rotation): void =>
    (map as game_map_instance).rotate_device(device_uid, new_rotation);

export const select_recipe = (map: game_map, device_uid: number, recipe_id?: string): void =>
    (map as game_map_instance).select_recipe(device_uid, recipe_id);
