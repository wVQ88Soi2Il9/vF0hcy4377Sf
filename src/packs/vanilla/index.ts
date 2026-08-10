import { hooks } from '@/core/hooks'
import { check_map_overlap } from '@/packs/vanilla/overlap'
import { build_device_graph } from '@/packs/vanilla/graph'

/**
 * Initialize the vanilla pack by registering its core logics to the engine hooks.
 */
export function init_vanilla_pack() 
{
    hooks.on_check_overlap.push(check_map_overlap);
    hooks.on_build_graph.push(build_device_graph);
}
