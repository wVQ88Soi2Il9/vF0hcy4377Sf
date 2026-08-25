import type { space, device, vector, space_command, space_command_factory, namespaced_id, device_constructor } from './types';
import
{
    create_device,
    restore_device,
    delete_device,
    move_device,
    select_recipe
} from './space_manager';

/**
 * Command for creating a device on the space.
 * On first execution, allocates a new device.
 * On subsequent re-executions (redo), restores the exact same device instance and UID.
 */
export function create_device_command
(
    device_class:  device_constructor,
    definition_id: namespaced_id,
    position:      vector,
    other_info:    Record<string, unknown> = {}
): space_command
{
    let created_dev: device | null = null;

    return {
        pack: 'core',
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
        execute(sp: space): void
        {
            if (!created_dev)
            {
                created_dev = create_device(sp, device_class, definition_id, position, other_info);
            }
            else
            {
                restore_device(sp, created_dev);
            }
        },
        inverse(sp: space): void
        {
            if (created_dev)
            {
                delete_device(sp, created_dev.uid);
            }
        }
    };
}

/**
 * Command for deleting a device from the space.
 * Caches the deleted device instance so inverse (undo) can restore it with all its state.
 */
export function delete_device_command(device_uid: number): space_command
{
    let deleted_dev: device | null = null;

    return {
        pack: 'core',
        id:   'delete_device',
        other_info:
        {
            core:
            {
                device_uid
            }
        },
        execute(sp: space): void
        {
            const target_uid = deleted_dev ? deleted_dev.uid : device_uid;
            const dev = delete_device(sp, target_uid);
            if (dev)
            {
                deleted_dev = dev;
            }
        },
        inverse(sp: space): void
        {
            if (deleted_dev)
            {
                restore_device(sp, deleted_dev);
            }
        }
    };
}

/**
 * Command for moving a device to a new position.
 * Remembers the original position so inverse (undo) can move it back.
 */
export function move_device_command(device_uid: number, new_position: vector): space_command
{
    let previous_position: vector | null = null;

    return {
        pack: 'core',
        id:   'move_device',
        other_info:
        {
            core:
            {
                device_uid,
                position: [...new_position]
            }
        },
        execute(sp: space): void
        {
            const dev = sp.devices.find(d => d.uid === device_uid);
            if (dev)
            {
                if (previous_position === null)
                {
                    previous_position = [...dev.position];
                }
                move_device(sp, device_uid, new_position);
            }
        },
        inverse(sp: space): void
        {
            if (previous_position !== null)
            {
                move_device(sp, device_uid, previous_position);
            }
        }
    };
}

/**
 * Command for selecting or clearing a device's recipe.
 * Remembers previous recipe ID so inverse (undo) can revert it.
 */
export function select_recipe_command(device_uid: number, new_recipe_id?: namespaced_id): space_command
{
    let previous_recipe_id: namespaced_id | undefined = undefined;
    let initialized = false;

    return {
        pack: 'core',
        id:   'select_recipe',
        other_info:
        {
            core:
            {
                device_uid,
                new_recipe_id
            }
        },
        execute(sp: space): void
        {
            const dev = sp.devices.find(d => d.uid === device_uid);
            if (dev)
            {
                if (!initialized)
                {
                    previous_recipe_id = dev.selected_recipe_id;
                    initialized = true;
                }
                select_recipe(sp, device_uid, new_recipe_id);
            }
        },
        inverse(sp: space): void
        {
            if (initialized)
            {
                select_recipe(sp, device_uid, previous_recipe_id);
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

export const core_commands: Record<string, space_command_factory> = {
    create_device: create_device_command,
    delete_device: delete_device_command,
    move_device:   move_device_command,
    select_recipe: select_recipe_command
};
