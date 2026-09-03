import * as core from '@/core';
import * as world from '@/world';

export function global_init(registry: core.pack_registry): void
{
    registry.packs.set
    ('vanilla_alpha', 
    {
        pack_id: 'vanilla_alpha',
        hooks: new Map
        (
            [
                ['create_device', []],
                ['delete_device', []],
                ['move_device', []],
                ['select_recipe', []],
                ['device_change', []],
                ['history_change', []],
                ['history_record', []],
                ['history_undo', []],
                ['history_redo', []],
                ['history_delete', []]
            ]
        )
    }
    );
}

export function world_init(target_world: world.pure_world): void
{
    // 將 device_change 綁定至所有裝置異動事件
    const relay_device_change = (...args: any[]) =>
    {
        target_world.trigger({ namespace: 'vanilla_alpha', id: 'device_change' }, ...args);
    };
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'create_device' }, relay_device_change);
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'delete_device' }, relay_device_change);
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'move_device' }, relay_device_change);
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'select_recipe' }, relay_device_change);

    // 將 history_change 綁定至所有歷史異動事件
    const relay_history_change = (...args: any[]) =>
    {
        target_world.trigger({ namespace: 'vanilla_alpha', id: 'history_change' }, ...args);
    };
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'history_record' }, relay_history_change);
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'history_undo' }, relay_history_change);
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'history_redo' }, relay_history_change);
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'history_delete' }, relay_history_change);
}
