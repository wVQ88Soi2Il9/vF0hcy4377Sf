import * as core from '@/core';
import * as world from '@/world';
import { register_console_cli } from './executor';

export * from './parser';
export * from './help';
export * from './executor';

export function global_init(registry: core.pack_registry): void
{
    registry.set('cli', {
        pack_id: 'cli',
        world_init
    });
}

export function world_init(target_world?: world.pure_world): void
{
    if (target_world)
    {
        register_console_cli(target_world);
    }
}
