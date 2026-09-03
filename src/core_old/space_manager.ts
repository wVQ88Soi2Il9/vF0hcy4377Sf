import type { device, vector, namespaced_id, device_constructor } from './types';
import { trigger_create_device, trigger_delete_device, trigger_move_device, trigger_select_recipe } from './hooks';

/**
 * 空間實體類別：封裝 N 維幾何維度、網格大小、UID 計數器與裝置實體集合。
 */
export class space
{
    public readonly dimension: number;
    public          size:      vector;
    public          uid:       number;
    public          devices:   device[];

    constructor(size: vector)
    {
        this.dimension = size.length;
        this.size = size;
        this.uid = 1;
        this.devices = [];
    }

    /**
     * 在空間中建立新裝置實例並自動分配 UID。
     */
    public create_device
    (
        device_class:  device_constructor,
        definition_id: namespaced_id,
        position:      vector,
        other_info:    Record<string, unknown> = {}
    ): device
    {
        const assigned_id = this.uid;
        const dev = new device_class(assigned_id, definition_id, position, other_info);

        this.uid += 1;
        this.devices.push(dev);
        trigger_create_device(this, dev);
        return dev;
    }

    /**
     * 還原既有裝置實例（Redo / Undo 還原時使用），維持原 UID。
     */
    public restore_device(dev: device): void
    {
        const exists = this.devices.some(d => d.uid === dev.uid);
        if (!exists)
        {
            this.devices.push(dev);
            if (dev.uid >= this.uid)
            {
                this.uid = dev.uid + 1;
            }
            trigger_create_device(this, dev);
        }
    }

    /**
     * 依 UID 從空間中移除裝置。
     */
    public delete_device(device_uid: number): device | undefined
    {
        const index = this.devices.findIndex(d => d.uid === device_uid);
        if (index !== -1)
        {
            const dev = this.devices[index];
            this.devices.splice(index, 1);
            trigger_delete_device(this, dev);
            return dev;
        }
        return undefined;
    }

    /**
     * 移動指定 UID 之裝置至新位置。
     */
    public move_device(device_uid: number, new_position: vector): void
    {
        const dev = this.devices.find(d => d.uid === device_uid);
        if (dev)
        {
            const old_position = dev.position;
            dev.position = new_position;
            trigger_move_device
            (
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
    public select_recipe(device_uid: number, recipe_id?: namespaced_id): void
    {
        const dev = this.devices.find(d => d.uid === device_uid);
        if (dev)
        {
            const old_recipe_id = dev.selected_recipe_id;
            dev.selected_recipe_id = recipe_id;
            trigger_select_recipe
            (
                this,
                dev,
                old_recipe_id,
                recipe_id
            );
        }
    }
}
