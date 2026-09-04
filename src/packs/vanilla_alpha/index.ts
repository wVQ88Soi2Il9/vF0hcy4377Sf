export * from './init';
export * from './operations';
export * from './world';
export * from './query';

import * as core from '@/core';

export function global_init(registry: core.pack_registry): void
{
    registry.set('vanilla_alpha', {
        pack_id: 'vanilla_alpha'
    });
}

export function world_init(): void
{

}
