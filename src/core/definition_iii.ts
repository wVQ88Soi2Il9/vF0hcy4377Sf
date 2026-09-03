import type { namespaced_id, hook_callback } from './definition_i';
import type { space, item_definition, recipe, device_constructor } from './definition_ii';

export interface reversible_operation extends namespaced_id 
{
    execute(sp: space): void;
    inverse(sp: space): void;
    other_info?: Record<string, unknown>;
}

export type reversible_operation_factory = (...args: any[]) => reversible_operation;

export interface pack_module
{
    pack_id:       string;
    items?:        Record<string, item_definition>;
    recipes?:      Record<string, recipe>;
    devices?:      Record<string, device_constructor>;
    operations?:   Record<string, reversible_operation_factory>;
    hooks?:        Map<string, hook_callback[]>;
    global_init?:  (...args: any[])=>void;
    world_init?:   (...args: any[]) => void;
    other_info?:  Record<string, unknown>;
}

export type pack_registry = Map<string, pack_module>;
