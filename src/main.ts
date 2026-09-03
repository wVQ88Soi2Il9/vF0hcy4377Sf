import
{
    build_empty_hook_list,
    type hook_list,
    type pack_registry
} from '@/core';

import * as empty_pack from '@/packs/empty_pack';

// ── 1. Initialize, Load all packs in order ────────────────────────────────────
export const registry: pack_registry = { packs: new Map() };

const ENABLED_PACKS =
[
    empty_pack
];

for (const pack of ENABLED_PACKS)
{
    pack.global_init(registry);
}

export const empty_hook_list: hook_list = build_empty_hook_list(registry);