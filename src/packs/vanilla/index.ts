import * as math from './math';
import * as spatial_map from './spatial_map';
import * as identifier from './identifier';
import * as device_utils from './device_utils';
import * as registry_query from './registry_query';
import * as recipe_query from './recipe_query';
import * as overlap from './overlap';
import * as graph from './graph';
import * as history from './history';

export * from './types';
export * from './math';
export * from './spatial_map';
export * from './identifier';
export * from './device_utils';
export * from './registry_query';
export * from './recipe_query';
export * from './overlap';
export * from './graph';
export * from './history';

export const vanilla = {
    pack_id: 'vanilla',
    ...math,
    ...spatial_map,
    ...identifier,
    ...device_utils,
    ...registry_query,
    ...recipe_query,
    ...overlap,
    ...graph,
    ...history
};

/**
 * Initialize the vanilla pack.
 * Called automatically by loader.ts.
 */
export function init_pack(): void
{
}
