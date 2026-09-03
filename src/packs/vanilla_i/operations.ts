/**
 * src/packs/vanilla_i/operations.ts — Vanilla 基礎空間可逆操作工廠
 *
 * 提供針對 space 裝置集合的 4 個標準原子可逆操作：
 * 1. create_device_operation
 * 2. delete_device_operation
 * 3. move_device_operation
 * 4. select_recipe_operation
 */

import * as core from '@/core';

export interface create_device_op extends core.reversible_operation
{
    get_device(): core.device | null;
}

export interface delete_device_op extends core.reversible_operation
{
    get_deleted_device(): core.device | null;
}

/**
 * 建立裝置操作：首度執行分配新裝置並佔據空間；Redo 重放時精準還原同一實例與 UID。
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
        namespace: 'vanilla_i',
        id:        'create_device',
        other_info:
        {
            ...other_info,
            core:
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
 * 刪除裝置操作：從空間移除裝置並快取其實例；Undo 撤銷時完整還原其資料。
 */
export function delete_device_operation(device_uid: core.uid): delete_device_op
{
    let deleted_dev: core.device | null = null;

    return {
        namespace: 'vanilla_i',
        id:        'delete_device',
        other_info:
        {
            core:
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
            if (index !== -1)
            {
                deleted_dev = sp.devices[index];
                sp.devices.splice(index, 1);
            }
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
 * 移動裝置操作：改變裝置座標並記憶原座標；Undo 撤銷時移回原位。
 */
export function move_device_operation(device_uid: core.uid, new_position: core.vector): core.reversible_operation
{
    let previous_position: core.vector | null = null;

    return {
        namespace: 'vanilla_i',
        id:        'move_device',
        other_info:
        {
            core:
            {
                device_uid,
                position: [...new_position]
            }
        },
        execute(sp: core.space): void
        {
            const dev = sp.devices.find(d => d.device_uid === device_uid);
            if (dev)
            {
                if (previous_position === null)
                {
                    previous_position = [...dev.position];
                }
                dev.position = [...new_position];
            }
        },
        inverse(sp: core.space): void
        {
            if (previous_position !== null)
            {
                const dev = sp.devices.find(d => d.device_uid === device_uid);
                if (dev)
                {
                    dev.position = [...previous_position];
                }
            }
        }
    };
}

/**
 * 選定配方操作：設定裝置選定配方並記憶舊配方；Undo 撤銷時還原舊配方。
 */
export function select_recipe_operation(device_uid: core.uid, new_recipe_id?: core.namespaced_id): core.reversible_operation
{
    let previous_recipe_id: core.namespaced_id | undefined = undefined;
    let initialized = false;

    return {
        namespace: 'vanilla_i',
        id:        'select_recipe',
        other_info:
        {
            core:
            {
                device_uid,
                new_recipe_id
            }
        },
        execute(sp: core.space): void
        {
            const dev = sp.devices.find(d => d.device_uid === device_uid);
            if (dev)
            {
                if (!initialized)
                {
                    previous_recipe_id = dev.selected_recipe_id;
                    initialized = true;
                }
                dev.selected_recipe_id = new_recipe_id;
            }
        },
        inverse(sp: core.space): void
        {
            if (initialized)
            {
                const dev = sp.devices.find(d => d.device_uid === device_uid);
                if (dev)
                {
                    dev.selected_recipe_id = previous_recipe_id;
                }
            }
        }
    };
}
