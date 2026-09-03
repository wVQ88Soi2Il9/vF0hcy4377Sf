/**
 * src/packs/vanilla_i/world.ts — Vanilla 標準世界實體
 *
 * 繼承 pure_world，並提供包含 4 個基本可逆地圖操作與歷程快捷控制的高階 API。
 */

import
{
    pure_world,
    type uid,
    type namespaced_id,
    type vector,
    type device,
    type device_constructor,
    type reversible_operation
} from '@/core';
import * as history from '@/core';
import 
{
    create_device_operation,
    delete_device_operation,
    move_device_operation,
    select_recipe_operation
} from './operations';

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
        this.trigger({ namespace: 'vanilla_i', id: 'create_device' }, this, dev);
        return dev;
    }

    public delete_device(device_uid: uid): device | undefined
    {
        const op = delete_device_operation(device_uid);
        this.execute([op]);
        const dev = op.get_deleted_device() ?? undefined;
        if (dev)
        {
            this.trigger({ namespace: 'vanilla_i', id: 'delete_device' }, this, dev);
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
                { namespace: 'vanilla_i', id: 'move_device' },
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
                { namespace: 'vanilla_i', id: 'select_recipe' },
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
