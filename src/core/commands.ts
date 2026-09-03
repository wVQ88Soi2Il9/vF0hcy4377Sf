import type { game_map, device, vector, map_command, map_command_factory, namespaced_id, device_constructor } from './types';
import
{
    create_device,
    restore_device,
    delete_device,
    move_device,
    select_recipe
} from './map_manager';

/**
 * Command for creating a device on the map.
 * On first execution, allocates a new device.
 * On subsequent re-executions (redo), restores the exact same device instance and UID.
 */
export function create_device_command
(
    device_class:  device_constructor,
    definition_id: namespaced_id,
    position:      vector,
    other_info:    Record<string, unknown> = {}
): map_command
{
    let created_dev: device | null = null;

    return {
        namespace: 'core',
        id:   'create_device',
        other_info:
        {
            ...other_info,
            core:
            {
                definition_id,
                position: [...position]
            }
        },
        execute(map: game_map): void
        {
            if (!created_dev)
            {
                created_dev = create_device(map, device_class, definition_id, position, other_info);
            }
            else
            {
                restore_device(map, created_dev);
            }
        },
        inverse(map: game_map): void
        {
            if (created_dev)
            {
                delete_device(map, created_dev.uid);
            }
        }
    };
}

/**
 * Command for deleting a device from the map.
 * Caches the deleted device instance so inverse (undo) can restore it with all its state.
 */
export function delete_device_command(device_uid: number): map_command
{
    let deleted_dev: device | null = null;

    return {
        namespace: 'core',
        id:   'delete_device',
        other_info:
        {
            core:
            {
                device_uid
            }
        },
        execute(map: game_map): void
        {
            const target_uid = deleted_dev ? deleted_dev.uid : device_uid;
            const dev = delete_device(map, target_uid);
            if (dev)
            {
                deleted_dev = dev;
            }
        },
        inverse(map: game_map): void
        {
            if (deleted_dev)
            {
                restore_device(map, deleted_dev);
            }
        }
    };
}

/**
 * Command for moving a device to a new position.
 * Remembers the original position so inverse (undo) can move it back.
 */
export function move_device_command(device_uid: number, new_position: vector): map_command
{
    let previous_position: vector | null = null;

    return {
        namespace: 'core',
        id:   'move_device',
        other_info:
        {
            core:
            {
                device_uid,
                position: [...new_position]
            }
        },
        execute(map: game_map): void
        {
            const dev = map.devices.find(d => d.uid === device_uid);
            if (dev)
            {
                if (previous_position === null)
                {
                    previous_position = [...dev.position];
                }
                move_device(map, device_uid, new_position);
            }
        },
        inverse(map: game_map): void
        {
            if (previous_position !== null)
            {
                move_device(map, device_uid, previous_position);
            }
        }
    };
}

/**
 * Command for selecting or clearing a device's recipe.
 * Remembers previous recipe ID so inverse (undo) can revert it.
 */
export function select_recipe_command(device_uid: number, new_recipe_id?: namespaced_id): map_command
{
    let previous_recipe_id: namespaced_id | undefined = undefined;
    let initialized = false;

    return {
        namespace: 'core',
        id:   'select_recipe',
        other_info:
        {
            core:
            {
                device_uid,
                new_recipe_id
            }
        },
        execute(map: game_map): void
        {
            const dev = map.devices.find(d => d.uid === device_uid);
            if (dev)
            {
                if (!initialized)
                {
                    previous_recipe_id = dev.selected_recipe_id;
                    initialized = true;
                }
                select_recipe(map, device_uid, new_recipe_id);
            }
        },
        inverse(map: game_map): void
        {
            if (initialized)
            {
                select_recipe(map, device_uid, previous_recipe_id);
            }
        }
    };
}

/**
 * Core pack standard commands map.
 */

(create_device_command as any).other_info = { cli: { describe: 'Create a device at target position' } };
(delete_device_command as any).other_info = { cli: { describe: 'Delete a device by UID' } };
(move_device_command as any).other_info = { cli: { describe: 'Move a device to a new position' } };
(select_recipe_command as any).other_info = { cli: { describe: 'Select recipe for a device' } };

export const core_commands: Record<string, map_command_factory> = {
    create_device: create_device_command,
    delete_device: delete_device_command,
    move_device:   move_device_command,
    select_recipe: select_recipe_command
};

