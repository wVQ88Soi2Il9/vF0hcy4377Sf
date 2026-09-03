/**
 * src/packs/vanilla_i/world.ts — Vanilla 標準世界實體
 *
 * 繼承 pure_world，並提供包含 4 個基本可逆地圖操作與歷程快捷控制的高階 API。
 */

import * as core from '@/core';
import * as world from '@/world';
import * as operations from './operations';

export class std_world extends world.pure_world
{
    public create_device
    (
        device_class:  core.device_constructor,
        definition_id: core.namespaced_id,
        position:      core.vector,
        other_info:    Record<string, unknown> = {}
    ): core.device
    {
        const op = operations.create_device_operation(device_class, definition_id, position, other_info);
        this.execute([op]);
        const dev = op.get_device()!;
        this.trigger({ namespace: 'vanilla_i', id: 'create_device' }, this, dev);
        this.trigger({ namespace: 'vanilla_i', id: 'device_change' }, this, dev);
        return dev;
    }

    public delete_device(device_uid: core.uid): core.device | undefined
    {
        const op = operations.delete_device_operation(device_uid);
        this.execute([op]);
        const dev = op.get_deleted_device() ?? undefined;
        if (dev)
        {
            this.trigger({ namespace: 'vanilla_i', id: 'delete_device' }, this, dev);
            this.trigger({ namespace: 'vanilla_i', id: 'device_change' }, this, dev);
        }
        return dev;
    }

    public move_device(device_uid: core.uid, new_position: core.vector): void
    {
        const dev = this.space.devices.find(d => d.device_uid === device_uid);
        const old_position = dev ? [...dev.position] : undefined;

        const op = operations.move_device_operation(device_uid, new_position);
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
            this.trigger({ namespace: 'vanilla_i', id: 'device_change' }, this, dev);
        }
    }

    public select_recipe(device_uid: core.uid, recipe_id?: core.namespaced_id): void
    {
        const dev = this.space.devices.find(d => d.device_uid === device_uid);
        const old_recipe_id = dev ? dev.selected_recipe_id : undefined;

        const op = operations.select_recipe_operation(device_uid, recipe_id);
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
            this.trigger({ namespace: 'vanilla_i', id: 'device_change' }, this, dev);
        }
    }

    /**
     * 在該世界上執行可逆指令序列。
     */
    public execute
    (
        ops:         core.reversible_operation[],
        other_info?: Record<string, unknown>
    ): void
    {
        const new_node = core.record_operation(this.history, this.space, ops, other_info);
        this.trigger({ namespace: 'vanilla_i', id: 'history_record' }, this, new_node);
        this.trigger({ namespace: 'vanilla_i', id: 'history_change' }, this, this.history);
    }

    /**
     * 在該世界上撤銷上一步。
     */
    public undo(): boolean
    {
        const success = core.jump_prev_node(this.history, this.space);
        if (success)
        {
            this.trigger({ namespace: 'vanilla_i', id: 'history_undo' }, this, this.history);
            this.trigger({ namespace: 'vanilla_i', id: 'history_change' }, this, this.history);
        }
        return success;
    }

    /**
     * 在該世界上重做下一步。
     */
    public redo(target?: core.uid): boolean
    {
        const success = core.jump_next_node(this.history, this.space, target);
        if (success)
        {
            this.trigger({ namespace: 'vanilla_i', id: 'history_redo' }, this, this.history);
            this.trigger({ namespace: 'vanilla_i', id: 'history_change' }, this, this.history);
        }
        return success;
    }

    /**
     * 跳轉至指定歷史節點。
     */
    public jump_to(target: core.uid): void
    {
        if (this.history.current_history_uid !== target)
        {
            core.jump_to_node(this.history, this.space, target);
            this.trigger({ namespace: 'vanilla_i', id: 'history_change' }, this, this.history);
        }
    }

    /**
     * 跳轉至上一個分支點。
     */
    public jump_to_prev_fork(): void
    {
        const before = this.history.current_history_uid;
        core.jump_to_prev_fork(this.history, this.space);
        if (this.history.current_history_uid !== before)
        {
            this.trigger({ namespace: 'vanilla_i', id: 'history_change' }, this, this.history);
        }
    }

    /**
     * 跳轉至歷史樹根節點（UID 0）。
     */
    public jump_to_root(): void
    {
        if (this.history.current_history_uid !== 0)
        {
            core.jump_to_root(this.history, this.space);
            this.trigger({ namespace: 'vanilla_i', id: 'history_change' }, this, this.history);
        }
    }

    /**
     * 沿當前分支前進至最深處（葉節點或下一個分岔點）。
     */
    public jump_to_leaf(): void
    {
        const before = this.history.current_history_uid;
        core.jump_to_next_fork(this.history, this.space);
        if (this.history.current_history_uid !== before)
        {
            this.trigger({ namespace: 'vanilla_i', id: 'history_change' }, this, this.history);
        }
    }

    /**
     * 刪除指定歷史節點。
     */
    public delete_history_node(target: core.uid): boolean
    {
        const success = core.delete_node(this.history, target);
        if (success)
        {
            this.trigger({ namespace: 'vanilla_i', id: 'history_delete' }, this, target);
            this.trigger({ namespace: 'vanilla_i', id: 'history_change' }, this, this.history);
        }
        return success;
    }
}
