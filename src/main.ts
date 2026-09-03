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

for (const pack of registry.values())
{
    if (pack.hooks)
    {
        empty_hook_list.push(new Map(pack.hooks));
    }
}

// ── 2. Create World ──────────────────────────────────────────────────────────
const sp = new core.space([64, 64, 4]);
const wwworld = new world.pure_world(sp, empty_hook_list, 'world_1');

// ── 3. Run World / Local Init ────────────────────────────────────────────────
for (const pack of ENABLED_PACKS)
{
    pack.world_init(wwworld);
}

// ── 4. Verify Trigger Event ──────────────────────────────────────────────────