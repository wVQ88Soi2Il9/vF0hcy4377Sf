import * as core from '@/core';
import * as world from '@/world';

export function global_init(registry: core.pack_registry): void
{
    registry.packs.set('vanilla_i', {
        pack_id: 'vanilla_i',
        hooks: new Map([
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
        ])
    });
}

export function local_init(_target_world: world.pure_world): void
{

}
