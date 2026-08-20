import type { game_map, device, vector } from '@/core/types';
import type { pack_registry } from '@/core/pack_manager';

export type check_overlap_hook = (map: game_map, registry: pack_registry) => unknown;
export type build_graph_hook = (map: game_map, registry: pack_registry) => unknown;
export type device_create_hook = (map: game_map, dev: device) => void;
export type device_delete_hook = (map: game_map, dev: device) => void;
export type device_move_hook =
(
    map:          game_map,
    dev:          device,
    old_position: vector,
    new_position: vector
) => void;
export type device_select_recipe_hook =
(
    map:           game_map,
    dev:           device,
    old_recipe_id: string | undefined,
    new_recipe_id: string | undefined
) => void;

export const hooks = 
{
    on_check_overlap:        [] as check_overlap_hook[],
    on_build_graph:          [] as build_graph_hook[],
    on_device_create:        [] as device_create_hook[],
    on_device_delete:        [] as device_delete_hook[],
    on_device_move:          [] as device_move_hook[],
    on_device_select_recipe: [] as device_select_recipe_hook[]
};

/**
 * Trigger all registered overlap hooks and collect their results.
 */
export function trigger_check_overlap
(
    map:      game_map, 
    registry: pack_registry
): unknown[] 
{
    const results: unknown[] = [];
    
    for (const hook of hooks.on_check_overlap) 
    {
        results.push(hook(map, registry));
    }
    
    return results;
}

/**
 * Trigger all registered graph build hooks and collect their resulting nodes.
 */
export function trigger_build_graph
(
    map:      game_map,
    registry: pack_registry
): unknown[] 
{
    const all_nodes: unknown[] = [];
    
    for (const hook of hooks.on_build_graph) 
    {
        const res = hook(map, registry);
        if (Array.isArray(res))
        {
            all_nodes.push(...res);
        }
        else
        {
            all_nodes.push(res);
        }
    }
    
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

export function trigger_select_recipe
(
    map:           game_map,
    dev:           device,
    old_recipe_id: string | undefined,
    new_recipe_id: string | undefined
): void
{
    for (const hook of hooks.on_device_select_recipe)
    {
        hook(map, dev, old_recipe_id, new_recipe_id);
    }
}
