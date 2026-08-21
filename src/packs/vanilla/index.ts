import { register_overlap_check, register_graph_build } from '@/API';
import { get_available_recipes } from './recipe_query';
import { check_map_overlap, is_out_of_bounds } from './overlap';
import { build_device_graph } from './graph';

export type { available_recipe_entry } from './recipe_query';
export type { map_validation_result, device_node, port_cell, device_graph } from './types';
export { get_available_recipes } from './recipe_query';
export { check_map_overlap, is_out_of_bounds } from './overlap';
export { build_device_graph } from './graph';


export const vanilla =
{
    get_available_recipes,
    check_map_overlap,
    build_device_graph,
    is_out_of_bounds
};

/**
 * Initialize the vanilla pack by registering its core logics to the engine hooks.
 * Called automatically by loader.ts — do not call manually.
 */
export function init_pack(): void
{
    register_overlap_check(check_map_overlap);
    register_graph_build(build_device_graph);
}
