import type { pack_module } from '@/core/types';

export interface pack_registry
{
    packs: Map<string, pack_module>;
}

/**
 * 建立一個空的 registry，採用單一 pack_module 字典結構
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