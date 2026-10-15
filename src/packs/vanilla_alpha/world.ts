import * as core from '@/core';
import * as world from '@/world';
import * as operations from './operations';

export class std_world extends world.pure_world
{
    private next_uid: number = 1;

    /**
     * 產生 uid 的方法，可由子類別覆寫。唯一性由 space 與 create 的前置條件保證，不依賴此方法。
     */
    protected allocate_uid(): core.uid
    {
        return this.next_uid++;
    }

    public create_device
    (
        device_class:  core.device_constructor,
        definition_id: core.namespaced_id,
        position:      core.vector,
        other_info:    Record<string, unknown> = {}
    ): core.device
    {
        const op = operations.create_device_operation(this.allocate_uid(), device_class, definition_id, position, other_info);
        this.submit([op]);
        return op.get_device()!;
    }

    public delete_device(device_uid: core.uid): core.device
    {
        const op = operations.delete_device_operation(device_uid);
        this.submit([op]);
        return op.get_deleted_device()!;
    }

    public move_device(device_uid: core.uid, new_position: core.vector): void
    {
        this.submit([operations.move_device_operation(device_uid, new_position)]);
    }

    public select_recipe(device_uid: core.uid, recipe_id?: core.namespaced_id): void
    {
        this.submit([operations.select_recipe_operation(device_uid, recipe_id)]);
    }
}
