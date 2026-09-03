import
{
    build_empty_hook_list,
    type pack_registry
} from '@/core';

/**
 * 建立一個空的 registry 容器（僅在初始化階段調用）。
 */
export function create_pack_registry(): pack_registry
{
    return { packs: new Map() };
}

// ── 1. Initialize ────────────────────────────────────────────────────────────
// Load packs in order and collect hook definitions into an empty hook template.
export const registry = create_pack_registry();

export const hook_template = build_empty_hook_list(registry);
