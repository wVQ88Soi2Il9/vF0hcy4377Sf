import type { uid, namespaced_id, vector, hook_list } from './definition_i';
import { space, device_constructor, device } from './definition_ii';
import type { reversible_operation } from './definition_iii';
import * as history from './history';

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
        const assigned_id = this.space.next_device_uid;
        const dev = new device_class(assigned_id, definition_id, position, other_info);

        this.space.next_device_uid += 1;
        this.space.devices.push(dev);

        this.trigger({namespace: 'std_world', id: 'create_device'}, this, dev);

        return dev;
    }

    /**
     * 還原既有裝置實例（Redo / Undo 還原時使用），維持原 UID。
     */
    public restore_device(dev: device): void
    {
        const exists = this.space.devices.some(d => d.device_uid === dev.device_uid);
        if (!exists)
        {
            this.space.devices.push(dev);
            if (dev.device_uid >= this.space.next_device_uid)
            {
                this.space.next_device_uid = dev.device_uid + 1;
            }
            this.trigger({namespace: 'std_world', id: 'create_device'}, this, dev);
        }
    }

    /**
     * 依 UID 從空間中移除裝置。
     */
    public delete_device(device_uid: uid): device | undefined
    {
        const index = this.space.devices.findIndex(d => d.device_uid === device_uid);
        if (index !== -1)
        {
            const dev = this.space.devices[index];
            this.space.devices.splice(index, 1);
            this.trigger({namespace: 'std_world', id: 'delete_device'}, this, dev);
            return dev;
        }
        return undefined;
    }

    /**
     * 移動指定 UID 之裝置至新位置。
     */
    public move_device(device_uid: uid, new_position: vector): void
    {
        const dev = this.space.devices.find(d => d.device_uid === device_uid);
        if (dev)
        {
            const old_position = dev.position;
            dev.position = new_position;
            this.trigger
            (
                {namespace: 'std_world', id: 'move_device'},
                this,
                dev,
                old_position,
                new_position
            );
        }
    }

    /**
     * 設定或清除裝置的選定配方。
     */
    public select_recipe(device_uid: uid, recipe_id?: namespaced_id): void
    {
        const dev = this.space.devices.find(d => d.device_uid === device_uid);
        if (dev)
        {
            const old_recipe_id = dev.selected_recipe_id;
            dev.selected_recipe_id = recipe_id;
            this.trigger
            (
                {namespace: 'std_world', id: 'select_recipe'},
                this,
                dev,
                old_recipe_id,
                recipe_id
            );
        }
    }
    /**
     * 在該世界上執行可逆指令。
     */
    public execute(operation: reversible_operation): void
    {
        history.record_operation(this.history, this.space, operation);
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
