import * as core from '@/core';
import * as world from '@/world';

export interface create_device_op extends core.rev_op
{
    get_device(): core.device | null;
}

export interface delete_device_op extends core.rev_op
{
    get_deleted_device(): core.device | null;
}

/**
 * 建立裝置：uid 於建立操作時即固定（如何產生 uid 不屬於操作）；
 * 首度執行建立裝置實例並加入空間，Redo 重放時還原同一實例。
 * 空間內 uid 必須唯一，違反時 Fail-Fast。
 */
export const create_device_template =
{
    namespace: 'vanilla_alpha',
    id:        'create_device',
    create
    (
        _target_world: world.pure_world,
        device_uid:    core.uid,
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
                    device_uid,
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
                if (sp.devices.has(device_uid))
                {
                    throw new Error(`Device with UID ${device_uid} already exists in space.`);
                }
                if (!created_dev)
                {
                    created_dev = new device_class(device_uid, definition_id, position, other_info);
                }
                sp.devices.set(device_uid, created_dev);
            },
            inverse(sp: core.space): void
            {
                if (!sp.devices.delete(device_uid))
                {
                    throw new Error(`Device with UID ${device_uid} not found in space.`);
                }
            }
        };
    }
} satisfies core.op_template<world.pure_world>;

/**
 * 刪除裝置：從空間移除裝置並快取其實例；Undo 撤銷時完整還原其資料。
 */
export const delete_device_template =
{
    namespace: 'vanilla_alpha',
    id:        'delete_device',
    create(_target_world: world.pure_world, device_uid: core.uid): delete_device_op
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
                const dev = sp.devices.get(device_uid);
                if (!dev)
                {
                    throw new Error(`Device with UID ${device_uid} not found in space.`);
                }
                deleted_dev = dev;
                sp.devices.delete(device_uid);
            },
            inverse(sp: core.space): void
            {
                if (!deleted_dev)
                {
                    return;
                }
                if (sp.devices.has(device_uid))
                {
                    throw new Error(`Device with UID ${device_uid} already exists in space.`);
                }
                sp.devices.set(device_uid, deleted_dev);
            }
        };
    }
} satisfies core.op_template<world.pure_world>;

/**
 * 移動裝置：改變裝置座標並記憶原座標；Undo 撤銷時移回原位。
 */
export const move_device_template =
{
    namespace: 'vanilla_alpha',
    id:        'move_device',
    create(_target_world: world.pure_world, device_uid: core.uid, new_position: core.vector): core.rev_op
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
                const dev = sp.devices.get(device_uid);
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
                    const dev = sp.devices.get(device_uid);
                    if (!dev)
                    {
                        throw new Error(`Device with UID ${device_uid} not found in space.`);
                    }
                    dev.position = [...previous_position];
                }
            }
        };
    }
} satisfies core.op_template<world.pure_world>;

/**
 * 選定配方：設定裝置選定配方並記憶舊配方；Undo 撤銷時還原舊配方。
 */
export const select_recipe_template =
{
    namespace: 'vanilla_alpha',
    id:        'select_recipe',
    create(_target_world: world.pure_world, device_uid: core.uid, new_recipe_id?: core.namespaced_id): core.rev_op
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
                const dev = sp.devices.get(device_uid);
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
                    const dev = sp.devices.get(device_uid);
                    if (!dev)
                    {
                        throw new Error(`Device with UID ${device_uid} not found in space.`);
                    }
                    dev.selected_recipe_id = previous_recipe_id;
                }
            }
        };
    }
} satisfies core.op_template<world.pure_world>;
