import { register_pack, type pack_registry, type pure_world } from '@/core';

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
    target_world.inject_hook({ namespace: 'empty_pack', id: 'foo' }, bar);
}