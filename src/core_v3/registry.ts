import type { item_definition, recipe, device_constructor, reversible_operation_factory } from './definition_ii';

/**
 * 模組命名空間物件 (Pack-as-a-Module-Object)
 */
export interface pack_module
{
    pack_id:       string;
    items?:        Record<string, item_definition>;
    recipes?:      Record<string, recipe>;
    devices?:      Record<string, device_constructor>;
    commands?:     Record<string, reversible_operation_factory>;
    init_pack?:    () => void;
    [key: string]: unknown;
}

export interface pack_registry
{
    packs: Map<string, pack_module>;
}

/**
 * 建立一個空的 registry 容器。
 */
export function create_pack_registry(): pack_registry
{
    return {
        packs: new Map()
    };
}

/**
 * 註冊一個 pack_module 物件進 registry。
 */
export function register_pack(registry: pack_registry, mod: pack_module): void
{
    registry.packs.set(mod.pack_id, mod);
}
