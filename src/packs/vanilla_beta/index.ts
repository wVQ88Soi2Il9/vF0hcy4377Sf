import * as device_inspector from './device_inspector';
export * from './device_inspector';
import { vanilla_commands, delete_branch_command, pin_node_command } from './commands';
import * as axes from './axes';
export * from './axes';
import * as math from './math';
import * as spatial_map from './spatial_map';
import * as identifier from './identifier';
import * as device_utils from './device_utils';
import * as registry_query from './registry_query';
import * as recipe_query from './recipe_query';
import * as overlap from './overlap';
import * as history from './history';

export * from './types';
export * from './math';
export * from './spatial_map';
export * from './identifier';
export * from './device_utils';
export * from './registry_query';
export * from './recipe_query';
export * from './overlap';
export * from './history';

import * as core from '@/core';

export const vanilla_beta = {
    pack_id: 'vanilla_beta',
    commands: vanilla_commands,
    ...math,
    ...spatial_map,
    ...identifier,
    ...device_utils,
    ...registry_query,
    ...axes,
    ...recipe_query,
    ...overlap,
    ...history,
    ...device_inspector
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

export { delete_branch_command, pin_node_command };
