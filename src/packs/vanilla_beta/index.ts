/**
 * src/packs/vanilla_beta/index.ts — vanilla_beta Pack 公開進入點
 */

import * as core from '@/core';

import * as axes from './axes';
import * as history from './history';

export * from './axes';
export * from './history';

export const vanilla_beta = {
    pack_id: 'vanilla_beta',
    ...axes,
    ...history
};

export function global_init(registry: core.pack_registry): void
{
    registry.packs.set('vanilla_beta', {
        pack_id: 'vanilla_beta'
    });
}

export function local_init(): void
{

}
