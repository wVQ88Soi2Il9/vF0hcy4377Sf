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

export const vanilla = {
    pack_id: 'vanilla',
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

/**
 * Initialize the vanilla pack.
 * Called automatically by loader.ts.
 */
export function init_pack(): void
{
}

export { delete_branch_command, pin_node_command };
