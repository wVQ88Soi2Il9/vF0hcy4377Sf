/**
 * src/packs/basic_renderer/index.ts — basic_renderer Pack 公開進入點
 */

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
