import type { uid, namespaced_id, vector, hook_list, hook_callback } from './definition_i';
import { space, device_constructor, device } from './definition_ii';
import type { reversible_operation } from './definition_iii';
import * as history from './history';
import 
{
    create_device_operation,
    delete_device_operation,
    move_device_operation,
    select_recipe_operation
} from './operations';

export class pure_world
{
    public readonly id:                 string;
    public          space:              space;
    public          history:            history.tree;
    public          current_hook:       hook_list;

    constructor(sp: space, template?: hook_list, id?: string)
    {
        this.id = id ?? `world_${Date.now()}`;
        this.space = sp;
        this.history = history.create_tree();
        this.current_hook = template ? structuredClone(template) : new Map();
    }

    public inject_hook(target_hook: namespaced_id, callback: hook_callback): void
    {
        this.current_hook.get(target_hook.namespace)!.get(target_hook.id)!.push(callback);
    }

    public trigger(namespaced_id: namespaced_id, ...args: any[]): void
    {
        const trigger_functions = this.current_hook.get(namespaced_id.namespace)?.get(namespaced_id.id) ?? [];
        for (const f of trigger_functions)
        {
            f(...args);
        }
    }
}
/**
 * 實體類別：world = space + history
 * 定義世界的本質結構
 */
export class std_world extends pure_world
{
    public create_device
    (
        device_class:  device_constructor,
        definition_id: namespaced_id,
        position:      vector,
        other_info:    Record<string, unknown> = {}
    ): device
    {
        const op = create_device_operation(device_class, definition_id, position, other_info);
        this.execute([op]);
        const dev = op.get_device()!;
        this.trigger({ namespace: 'std_world', id: 'create_device' }, this, dev);
        return dev;
    }

    public delete_device(device_uid: uid): device | undefined
    {
        const op = delete_device_operation(device_uid);
        this.execute([op]);
        const dev = op.get_deleted_device() ?? undefined;
        if (dev)
        {
            this.trigger({ namespace: 'std_world', id: 'delete_device' }, this, dev);
        }
        return dev;
    }

    public move_device(device_uid: uid, new_position: vector): void
    {
        const dev = this.space.devices.find(d => d.device_uid === device_uid);
        const old_position = dev ? [...dev.position] : undefined;

        const op = move_device_operation(device_uid, new_position);
        this.execute([op]);

        if (dev && old_position)
        {
            this.trigger
            (
                { namespace: 'std_world', id: 'move_device' },
                this,
                dev,
                old_position,
                new_position
            );
        }
    }

    public select_recipe(device_uid: uid, recipe_id?: namespaced_id): void
    {
        const dev = this.space.devices.find(d => d.device_uid === device_uid);
        const old_recipe_id = dev ? dev.selected_recipe_id : undefined;

        const op = select_recipe_operation(device_uid, recipe_id);
        this.execute([op]);

        if (dev)
        {
            this.trigger
            (
                { namespace: 'std_world', id: 'select_recipe' },
                this,
                dev,
                old_recipe_id,
                recipe_id
            );
        }
    }
    /**
     * 在該世界上執行可逆指令序列。
     */
    public execute
    (
        operations:  reversible_operation[],
        other_info?: Record<string, unknown>
    ): void
    {
        history.record_operation(this.history, this.space, operations, other_info);
    }

    /**
     * 在該世界上撤銷上一步。
     */
    public undo(): boolean
    {
        return history.jump_prev_node(this.history, this.space);
    }

    /**
     * 在該世界上重做下一步。
     */
    public redo(target?: uid): boolean
    {
        return history.jump_next_node(this.history, this.space, target);
    }

    /**
     * 跳轉至指定歷史節點。
     */
    public jump_to(target: uid): void
    {
        history.jump_to_node(this.history, this.space, target);
    }

    /**
     * 跳轉至上一個分支點。
     */
    public jump_to_prev_fork(): void
    {
        history.jump_to_prev_fork(this.history, this.space);
    }

    /**
     * 跳轉至歷史樹根節點（UID 0）。
     */
    public jump_to_root(): void
    {
        history.jump_to_root(this.history, this.space);
    }

    /**
     * 沿當前分支前進至最深處（葉節點或下一個分岔點）。
     */
    public jump_to_leaf(): void
    {
        history.jump_to_next_fork(this.history, this.space);
    }

    /**
     * 刪除指定歷史節點。
     */
    public delete_history_node(target: uid): boolean
    {
        return history.delete_node(this.history, target);
    }
}
