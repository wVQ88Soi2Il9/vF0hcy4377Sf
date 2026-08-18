import { register_overlap_check, register_graph_build } from '@/API';
import { check_map_overlap } from '@/packs/vanilla/overlap';
import { build_device_graph } from '@/packs/vanilla/graph';

export type { map_validation_result, device_node } from './types';


/**
 * Initialize the vanilla pack by registering its core logics to the engine hooks.
 * Called automatically by loader.ts — do not call manually.
 */
export function init_pack(): void
{
    register_overlap_check(check_map_overlap);
    register_graph_build(build_device_graph);
}
