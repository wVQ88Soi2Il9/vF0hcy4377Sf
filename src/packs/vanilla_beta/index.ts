/**
 * src/packs/vanilla_beta/index.ts — vanilla_beta Pack 公開進入點
 */

import * as core from '@/core';

import * as axes from './axes';
import * as identifier from './identifier';
import * as registry_query from './registry_query';
import * as recipe_query from './recipe_query';
import * as history from './history';

export * from './axes';
export * from './identifier';
export * from './registry_query';
export * from './recipe_query';
export * from './history';

export const vanilla_beta = {
    pack_id: 'vanilla_beta',
    ...axes,
    ...identifier,
    ...registry_query,
    ...recipe_query,
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
