import * as core from '@/core';
import * as world from '@/world';

import * as vanilla_alpha from '@/packs/vanilla_alpha'

// ── 1. Initialize, Load all packs in order ────────────────────────────────────
const registry: core.pack_registry = new Map();

const ENABLED_PACKS =
[
    vanilla_alpha
];

for (const pack of ENABLED_PACKS)
{
    pack.global_init(registry);
}

const empty_hook_list: core.hook_list = new Map();

for (const [id, pack] of registry)
{
    if (pack.hooks)
    {
        empty_hook_list.set(id, new Map(pack.hooks));
    }
}
// ── 2. Create World ──────────────────────────────────────────────────────────
const sp = new core.space([64, 64, 4]);
new world.pure_world(sp, registry, empty_hook_list, 'wwworld');