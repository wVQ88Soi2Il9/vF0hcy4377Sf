import * as core from '@/core';
import * as world from '@/world';

import * as vanilla_i from '@/packs/vanilla_i'

// ── 1. Initialize, Load all packs in order ────────────────────────────────────
const registry: core.pack_registry = { packs: new Map() };

const ENABLED_PACKS =
[
    vanilla_i
];

for (const pack of ENABLED_PACKS)
{
    pack.global_init(registry);
}

const empty_hook_list: core.hook_list = new Map();

for (const [id, pack] of registry.packs)
{
    if (pack.hooks)
    {
        empty_hook_list.set(id, new Map(pack.hooks));
    }
}

// ── 2. Create World ──────────────────────────────────────────────────────────
const sp = new core.space([64, 64, 4]);
const wwworld = new world.pure_world(sp, empty_hook_list, 'world_1');

// ── 3. Run World / Local Init ────────────────────────────────────────────────
for (const pack of ENABLED_PACKS)
{
    pack.local_init(wwworld);
}

// ── 4. Verify Trigger Event ──────────────────────────────────────────────────