import * as core from '@/core';


export * from './parser';
export * from './help';
export * from './executor';

export function global_init(registry: core.pack_registry): void
{
    registry.packs.set('cli', {
        pack_id: 'cli'
    });
}

export function world_init(): void
{

}
