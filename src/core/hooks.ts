import type { game_map, map_validation_result, device_node } from '@/core/types'
import type { pack_registry } from '@/core/pack_manager'

export type check_overlap_hook = (map: game_map, registry: pack_registry) => map_validation_result;
export type build_graph_hook = (map: game_map, registry: pack_registry) => device_node[];

export const hooks = {
    on_check_overlap: [] as check_overlap_hook[],
    on_build_graph: [] as build_graph_hook[]
};

/**
 * Trigger all registered overlap hooks and merge their results.
 */
export function trigger_check_overlap(map: game_map, registry: pack_registry): map_validation_result {
    const result: map_validation_result = { out_of_bounds: [], overlapped: [] };
    
    for (const hook of hooks.on_check_overlap) {
        const res = hook(map, registry);
        result.out_of_bounds.push(...res.out_of_bounds);
        result.overlapped.push(...res.overlapped);
    }
    
    // Deduplicate unique_ids
    result.out_of_bounds = Array.from(new Set(result.out_of_bounds));
    result.overlapped = Array.from(new Set(result.overlapped));
    
    return result;
}

/**
 * Trigger all registered graph build hooks and concatenate their resulting nodes.
 */
export function trigger_build_graph(map: game_map, registry: pack_registry): device_node[] {
    const all_nodes: device_node[] = [];
    
    for (const hook of hooks.on_build_graph) {
        all_nodes.push(...hook(map, registry));
    }
    
    // For now, we simply concatenate all nodes. 
    // If multiple hooks generate nodes for the same device, it may need further merging.
    return all_nodes;
}
