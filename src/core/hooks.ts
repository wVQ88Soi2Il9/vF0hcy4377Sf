import type { game_map, map_validation_result, device_node, device, vector, rotation } from '@/core/types'
import type { pack_registry } from '@/core/pack_manager'

export type check_overlap_hook = (map: game_map, registry: pack_registry) => map_validation_result;
export type build_graph_hook = (map: game_map, registry: pack_registry) => device_node[];
export type device_create_hook = (map: game_map, dev: device) => void;
export type device_delete_hook = (map: game_map, dev: device) => void;
export type device_move_hook =
(
    map:          game_map,
    dev:          device,
    old_position: vector,
    new_position: vector
) => void;
export type device_rotate_hook =
(
    map:          game_map,
    dev:          device,
    old_rotation: rotation,
    new_rotation: rotation
) => void;

export const hooks = 
{
    on_check_overlap: [] as check_overlap_hook[],
    on_build_graph: [] as build_graph_hook[],
    on_device_create: [] as device_create_hook[],
    on_device_delete: [] as device_delete_hook[],
    on_device_move: [] as device_move_hook[],
    on_device_rotate: [] as device_rotate_hook[]
};

/**
 * Trigger all registered overlap hooks and merge their results.
 */
export function trigger_check_overlap
(
    map: game_map, 
    registry: pack_registry
): map_validation_result 
{
    const result: map_validation_result = { out_of_bounds: [], overlapped: [] };
    
    for (const hook of hooks.on_check_overlap) 
    {
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
export function trigger_build_graph
(
    map:      game_map,
    registry: pack_registry
): device_node[] 
{
    const all_nodes: device_node[] = [];
    
    for (const hook of hooks.on_build_graph) 
    {
        all_nodes.push(...hook(map, registry));
    }
    
    // For now, we simply concatenate all nodes. 
    // If multiple hooks generate nodes for the same device, it may need further merging.
    return all_nodes;
}

export function trigger_create_device(map: game_map, dev: device): void
{
    for (const hook of hooks.on_device_create)
    {
        hook(map, dev);
    }
}

export function trigger_delete_device(map: game_map, dev: device): void
{
    for (const hook of hooks.on_device_delete)
    {
        hook(map, dev);
    }
}

export function trigger_move_device
(
    map:          game_map,
    dev:          device,
    old_position: vector,
    new_position: vector
): void
{
    for (const hook of hooks.on_device_move)
    {
        hook(map, dev, old_position, new_position);
    }
}

export function trigger_rotate_device
(
    map:          game_map,
    dev:          device,
    old_rotation: rotation,
    new_rotation: rotation
): void
{
    for (const hook of hooks.on_device_rotate)
    {
        hook(map, dev, old_rotation, new_rotation);
    }
}
