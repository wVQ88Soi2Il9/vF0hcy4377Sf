/**
 * src/packs/camera/index.ts — camera Pack 公開進入點
 */

import * as core from '@/core';

export * from './types';
export * from './projection';
export * from './render';

export function global_init(registry: core.pack_registry): void
{
    registry.set('camera', {
        pack_id: 'camera'
    });
}

export function world_init(): void
{

}
