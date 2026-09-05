import type { namespaced_id, hook_callback } from './definition_i';
import type { space, item_definition, recipe, device_constructor } from './definition_ii';

export interface rev_op extends namespaced_id 
{
    execute(sp: space,...args: any[]): void;
    inverse(sp: space,...args: any[]): void;
    other_info?: Record<string, unknown>;
}

export interface cmd extends namespaced_id
{
    execute(...args: any[]): any;
    other_info?: Record<string, unknown>;
}

export interface pack_module
{
    pack_id:       string;
    items?:        Record<string, item_definition>;
    recipes?:      Record<string, recipe>;
    devices?:      Record<string, device_constructor>;
    operations?:   Record<string, rev_op>;
    commands?:     Record<string, cmd>;
    hooks?:        Map<string, hook_callback[]>;
    global_init?:  (...args: any[])=>void;
    world_init?:   (...args: any[]) => void;
    other_info?:  Record<string, unknown>;
}

export type pack_registry = Map<string, pack_module>;
