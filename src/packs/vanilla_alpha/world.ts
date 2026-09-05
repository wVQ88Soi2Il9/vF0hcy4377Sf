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
        this.trigger({ namespace: 'vanilla_alpha', id: 'create_device' }, this, dev);
        return dev;
    }

    public delete_device(device_uid: core.uid): core.device | undefined
    {
        const op = operations.delete_device_operation(device_uid);
        this.execute([op]);
        const dev = op.get_deleted_device() ?? undefined;
        if (dev)
        {
            this.trigger({ namespace: 'vanilla_alpha', id: 'delete_device' }, this, dev);
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
                { namespace: 'vanilla_alpha', id: 'move_device' },
                this,
                dev,
                old_position,
                new_position
            );
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
                { namespace: 'vanilla_alpha', id: 'select_recipe' },
                this,
                dev,
                old_recipe_id,
                recipe_id
            );
        }
    }

    public execute
    (
        ops:         core.rev_op[],
        other_info?: Record<string, unknown>
    ): void
    {
        const new_node = core.record_operation(this.history, this.space, ops, other_info);
        this.trigger({ namespace: 'vanilla_alpha', id: 'history_record' }, this, new_node);
    }

    public undo(): boolean
    {
        const success = core.jump_prev_node(this.history, this.space);
        if (success)
        {
            this.trigger({ namespace: 'vanilla_alpha', id: 'history_undo' }, this, this.history);
        }
        return success;
    }

    public redo(target?: core.uid): boolean
    {
        const success = core.jump_next_node(this.history, this.space, target);
        if (success)
        {
            this.trigger({ namespace: 'vanilla_alpha', id: 'history_redo' }, this, this.history);
        }
        return success;
    }

    public jump_to(target: core.uid): void
    {
        if (this.history.current_history_uid !== target)
        {
            core.jump_to_node(this.history, this.space, target);
        }
    }

    public jump_to_prev_fork(): void
    {
        core.jump_to_prev_fork(this.history, this.space);
    }

    public jump_to_root(): void
    {
        if (this.history.current_history_uid !== 0)
        {
            core.jump_to_root(this.history, this.space);
        }
    }

    public jump_to_leaf(): void
    {
        core.jump_to_next_fork(this.history, this.space);
    }

    public delete_history_node(target: core.uid): boolean
    {
        const success = core.delete_node(this.history, target);
        if (success)
        {
            this.trigger({ namespace: 'vanilla_alpha', id: 'history_delete' }, this, target);
        }
        return success;
    }
}
