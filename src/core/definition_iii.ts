import type { namespaced_id, hook_callback, hook_list } from './definition_i';
import type { space, item_definition, recipe, device_constructor } from './definition_ii';

export interface rev_op extends namespaced_id 
{
    execute(sp: space,...args: any[]): void;
    inverse(sp: space,...args: any[]): void;
    other_info?: Record<string, unknown>;
}

export interface op_template<W = unknown> extends namespaced_id
{
    create(target_world: W, ...args: any[]): rev_op;
    other_info?: Record<string, unknown>;
}

export interface cmd<C = unknown> extends namespaced_id
{
    execute(context: C, ...args: any[]): any;
    other_info?: Record<string, unknown>;
}

export interface pack_module
{
    pack_id:       string;
    items?:        Record<string, item_definition>;
    recipes?:      Record<string, recipe>;
    devices?:      Record<string, device_constructor>;
    op_templates?: Record<string, op_template>;
    commands?:     Record<string, cmd>;
    other_info?:   Record<string, unknown>;
}

export type pack_registry = Map<string, pack_module>;

export interface catalog
{
    registry:      pack_registry;
    handlers:      hook_list;
    create_states: Map<string, () => unknown>;
}

export interface pack_manifest
{
    pack_id:       string;
    provides?:     Omit<pack_module, 'pack_id'>;
    on?:           Record<string, hook_callback>;
    create_state?: () => unknown;
    patch?:        (draft: catalog) => void;
}
