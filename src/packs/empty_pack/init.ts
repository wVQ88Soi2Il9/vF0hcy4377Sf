import { register_pack, inject_world_hook, type pack_registry, type pure_world } from '@/core';

export function bar(): void
{

}

export function global_init(registry: pack_registry): void
{
    register_pack(registry, {
        pack_id: 'empty_pack',
        hooks: new Map([
            ['foo', []]
        ])
    });
}

export function local_init(target_world: pure_world): void
{
    inject_world_hook(target_world, { namespace: 'empty_pack', id: 'foo' }, bar);
}