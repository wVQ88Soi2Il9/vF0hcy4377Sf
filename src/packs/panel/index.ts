import * as core from '@/core';

export * from './definition';
export * from './fill';

export function global_init(registry: core.pack_registry): void
{
    registry.set('panel', {
        pack_id: 'panel'
    });
}

export function world_init(): void
{

}
