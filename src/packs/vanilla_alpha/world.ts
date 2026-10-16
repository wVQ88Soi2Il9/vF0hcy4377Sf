import * as core from '@/core';
import * as world from '@/world';
import * as templates from './templates';

export class std_world extends world.pure_world
{
    /**
     * 產生 uid 的方法，預設為 core.generate_uid，可由子類別覆寫。唯一性由 space 與 create 的前置條件保證，不依賴此方法。
     */
    protected allocate_uid(): core.uid
    {
        return core.generate_uid();
    }

    public create_device
    (
        device_class:  core.device_constructor,
        definition_id: core.namespaced_id,
        position:      core.vector,
        other_info:    Record<string, unknown> = {}
    ): core.device
    {
        const op = templates.create_device_template.create(this, this.allocate_uid(), device_class, definition_id, position, other_info);
        this.submit([op]);
        return op.get_device()!;
    }

    public delete_device(device_uid: core.uid): core.device
    {
        const op = templates.delete_device_template.create(this, device_uid);
        this.submit([op]);
        return op.get_deleted_device()!;
    }

    public move_device(device_uid: core.uid, new_position: core.vector): void
    {
        this.submit([templates.move_device_template.create(this, device_uid, new_position)]);
    }

    public select_recipe(device_uid: core.uid, recipe_id?: core.namespaced_id): void
    {
        this.submit([templates.select_recipe_template.create(this, device_uid, recipe_id)]);
    }
}
