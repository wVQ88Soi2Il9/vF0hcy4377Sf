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
            ['select_recipe', []]
        ])
    });
}

export function local_init(_target_world: world.pure_world): void
{

}
