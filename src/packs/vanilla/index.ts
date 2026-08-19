import { register_overlap_check, register_graph_build } from '@/API';
import { check_map_overlap } from '@/packs/vanilla/overlap';
import { build_device_graph } from '@/packs/vanilla/graph';
import { get_available_recipes } from '@/packs/vanilla/recipe_query';

export type { map_validation_result, device_node } from './types';
export type { available_recipe_entry } from './recipe_query';

export const vanilla =
{
    check_map_overlap,
    build_device_graph,
    get_available_recipes
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
