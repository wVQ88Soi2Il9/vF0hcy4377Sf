import
{
    hook_list,
    type pack_registry
} from '@/core';

// ── 1. Initialize, Load all packs in order ────────────────────────────────────────────────────────────
export const registry: pack_registry = { packs: new Map() };



export const empty_hook_list: hook_list = new Map();