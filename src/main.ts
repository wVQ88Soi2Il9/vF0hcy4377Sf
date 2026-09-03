import
{
    build_empty_hook_list,
    type pack_registry
} from '@/core';

// ── 1. Initialize ────────────────────────────────────────────────────────────
export const registry: pack_registry = { packs: new Map() };

export const hook_template = build_empty_hook_list(registry);
