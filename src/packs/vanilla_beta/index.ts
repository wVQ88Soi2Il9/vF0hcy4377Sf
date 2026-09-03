/**
 * src/packs/vanilla_beta/index.ts — vanilla_beta Pack 公開進入點
 */

import * as core from '@/core';

export * from './axes';
export * from './history';

export function global_init(registry: core.pack_registry): void
{
    registry.packs.set('vanilla_beta', {
        pack_id: 'vanilla_beta'
    });
}

export function local_init(): void
{

}
