import { register_overlap_check, register_graph_build } from '@/API';
import { get_available_recipes } from './recipe_query';
import { check_map_overlap, is_out_of_bounds } from './overlap';
import { build_device_graph } from './graph';
import
{
    delete_branch,
    is_node_pinned,
    set_node_pin,
    toggle_node_pin,
    get_pinned_nodes,
    clear_all_pinned_nodes,
    get_vanilla_node_info,
    set_vanilla_node_info,
    get_node_merged_from,
    set_node_merged_from,
    extract_branch_path,
    check_merge_conflicts,
    aggregate_branch_mutations,
    composite_map_command,
    replay_branch_commands,
    merge_branch
} from './history';

export type { available_recipe_entry } from './recipe_query';
export type { map_validation_result, device_node } from './types';
export type { vanilla_history_node_info, merge_conflict, merge_conflict_check_result, merge_branch_result } from './history';
export { get_available_recipes } from './recipe_query';
export { check_map_overlap, is_out_of_bounds } from './overlap';
export { build_device_graph } from './graph';
export
{
    delete_branch,
    is_node_pinned,
    set_node_pin,
    toggle_node_pin,
    get_pinned_nodes,
    clear_all_pinned_nodes,
    get_vanilla_node_info,
    set_vanilla_node_info,
    get_node_merged_from,
    set_node_merged_from,
    extract_branch_path,
    check_merge_conflicts,
    aggregate_branch_mutations,
    composite_map_command,
    replay_branch_commands,
    merge_branch
};

export const vanilla =
{
    get_available_recipes,
    check_map_overlap,
    build_device_graph,
    is_out_of_bounds,
    delete_branch,
    is_node_pinned,
    set_node_pin,
    toggle_node_pin,
    get_pinned_nodes,
    clear_all_pinned_nodes,
    get_vanilla_node_info,
    set_vanilla_node_info,
    get_node_merged_from,
    set_node_merged_from,
    extract_branch_path,
    check_merge_conflicts,
    aggregate_branch_mutations,
    composite_map_command,
    replay_branch_commands,
    merge_branch
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
