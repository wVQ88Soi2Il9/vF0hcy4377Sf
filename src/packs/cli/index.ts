import * as core from '@/core';
import { generate_help } from './help';

export * from './parser';
export * from './executor';
export * from './help';

export function global_init(registry: core.pack_registry): void
{
    registry.set('cli', {
        pack_id: 'cli'
    });
}

export function world_init(): void
{

}
