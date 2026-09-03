import * as core from '@/core';
import * as world from '@/world';

export function bar(): void
{
    console.log('bar');
}

export function foo(target_world: world.pure_world): void
{
    console.log('foo');
    target_world.trigger({ namespace: 'empty_pack', id: 'foo' });
}

export function global_init(registry: core.pack_registry): void
{
    registry.packs.set('empty_pack', {
        pack_id: 'empty_pack',
        hooks: new Map([
            ['foo', []]
        ])
    });
}

export function local_init(target_world: world.pure_world): void
{
    target_world.inject_hook({ namespace: 'empty_pack', id: 'foo' }, bar);
}