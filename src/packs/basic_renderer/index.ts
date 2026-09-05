
import * as core from '@/core';

export * from './fallback';
export * from './renderer';
export * from './types';

export function global_init(registry: core.pack_registry): void
{
    registry.set('basic_renderer', {
        pack_id: 'basic_renderer'
    });
}

export function world_init(): void
{

}
