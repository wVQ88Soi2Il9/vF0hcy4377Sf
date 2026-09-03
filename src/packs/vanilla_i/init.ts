import type { pack_registry, pure_world } from '@/core';

export function global_init(registry: pack_registry): void
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

export function local_init(_target_world: pure_world): void
{

}
