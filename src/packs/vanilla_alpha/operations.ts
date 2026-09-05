import * as core from '@/core';

export interface create_device_op extends core.rev_op
{
    get_device(): core.device | null;
}

export interface delete_device_op extends core.rev_op
{
    get_deleted_device(): core.device | null;
}

/**
 * Create device operation: allocates and inserts a device; on redo restores the identical instance and UID.
 */
export function create_device_operation
(
    device_class:  core.device_constructor,
    definition_id: core.namespaced_id,
    position:      core.vector,
    other_info:    Record<string, unknown> = {}
): create_device_op
{
    let created_dev: core.device | null = null;

    return {
        namespace: 'vanilla_alpha',
        id:        'create_device',
        other_info:
        {
            ...other_info,
            vanilla_alpha:
            {
                definition_id,
                position: [...position]
            }
        },
        get_device(): core.device | null
        {
            return created_dev;
        },
        execute(sp: core.space): void
        {
            if (!created_dev)
            {
                const assigned_id = sp.next_device_uid;
                created_dev = new device_class(assigned_id, definition_id, position, other_info);
                sp.next_device_uid += 1;
                sp.devices.push(created_dev);
            }
            else
            {
                const exists = sp.devices.some(d => d.device_uid === created_dev!.device_uid);
                if (!exists)
                {
                    sp.devices.push(created_dev);
                    if (created_dev.device_uid >= sp.next_device_uid)
                    {
                        sp.next_device_uid = created_dev.device_uid + 1;
                    }
                }
            }
        },
        inverse(sp: core.space): void
        {
            if (created_dev)
            {
                const index = sp.devices.findIndex(d => d.device_uid === created_dev!.device_uid);
                if (index !== -1)
                {
                    sp.devices.splice(index, 1);
                }
            }
        }
    };
}

/**
 * Delete device operation: removes device from space and caches it; on undo restores it completely.
 */
export function delete_device_operation(device_uid: core.uid): delete_device_op
{
    let deleted_dev: core.device | null = null;

    return {
        namespace: 'vanilla_alpha',
        id:        'delete_device',
        other_info:
        {
            vanilla_alpha:
            {
                device_uid
            }
        },
        get_deleted_device(): core.device | null
        {
            return deleted_dev;
        },
        execute(sp: core.space): void
        {
            const target_uid = deleted_dev ? deleted_dev.device_uid : device_uid;
            const index = sp.devices.findIndex(d => d.device_uid === target_uid);
            if (index === -1)
            {
                throw new Error(`Device with UID ${target_uid} not found in space.`);
            }
            deleted_dev = sp.devices[index];
            sp.devices.splice(index, 1);
        },
        inverse(sp: core.space): void
        {
            if (deleted_dev)
            {
                const exists = sp.devices.some(d => d.device_uid === deleted_dev!.device_uid);
                if (!exists)
                {
                    sp.devices.push(deleted_dev);
                    if (deleted_dev.device_uid >= sp.next_device_uid)
                    {
                        sp.next_device_uid = deleted_dev.device_uid + 1;
                    }
                }
            }
        }
    };
}

/**
 * Move device operation: updates device position and remembers previous position; on undo restores it.
 */
export function move_device_operation(device_uid: core.uid, new_position: core.vector): core.rev_op
{
    let previous_position: core.vector | null = null;

    return {
        namespace: 'vanilla_alpha',
        id:        'move_device',
        other_info:
        {
            vanilla_alpha:
            {
                device_uid,
                position: [...new_position]
            }
        },
        execute(sp: core.space): void
        {
            const dev = sp.devices.find(d => d.device_uid === device_uid);
            if (!dev)
            {
                throw new Error(`Device with UID ${device_uid} not found in space.`);
            }
            if (previous_position === null)
            {
                previous_position = [...dev.position];
            }
            dev.position = [...new_position];
        },
        inverse(sp: core.space): void
        {
            if (previous_position !== null)
            {
                const dev = sp.devices.find(d => d.device_uid === device_uid);
                if (!dev)
                {
                    throw new Error(`Device with UID ${device_uid} not found in space.`);
                }
                dev.position = [...previous_position];
            }
        }
    };
}

/**
 * Select recipe operation: sets selected recipe and remembers previous recipe; on undo restores it.
 */
export function select_recipe_operation(device_uid: core.uid, new_recipe_id?: core.namespaced_id): core.rev_op
{
    let previous_recipe_id: core.namespaced_id | undefined = undefined;
    let initialized = false;

    return {
        namespace: 'vanilla_alpha',
        id:        'select_recipe',
        other_info:
        {
            vanilla_alpha:
            {
                device_uid,
                new_recipe_id
            }
        },
        execute(sp: core.space): void
        {
            const dev = sp.devices.find(d => d.device_uid === device_uid);
            if (!dev)
            {
                throw new Error(`Device with UID ${device_uid} not found in space.`);
            }
            if (!initialized)
            {
                previous_recipe_id = dev.selected_recipe_id;
                initialized = true;
            }
            dev.selected_recipe_id = new_recipe_id;
        },
        inverse(sp: core.space): void
        {
            if (initialized)
            {
                const dev = sp.devices.find(d => d.device_uid === device_uid);
                if (!dev)
                {
                    throw new Error(`Device with UID ${device_uid} not found in space.`);
                }
                dev.selected_recipe_id = previous_recipe_id;
            }
        }
    };
}
