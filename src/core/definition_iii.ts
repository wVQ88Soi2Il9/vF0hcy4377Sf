/* how to control a world */

import { namespaced_id, hook_callback } from "./definition_i";
import { space, item_definition, recipe, device_constructor } from "./definition_ii";

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
    init_pack?:    () => void;
    [key: string]: unknown;
}

export interface pack_registry
{
    packs: Map<string, pack_module>;
}

/**
 * 註冊一個 pack_module 物件進 registry。
 */
export function register_pack(registry: pack_registry, mod: pack_module): void
{
    registry.packs.set(mod.pack_id, mod);
}
