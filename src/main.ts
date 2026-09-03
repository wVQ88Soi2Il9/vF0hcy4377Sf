import
{
    space,
    pure_world,
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

export const empty_hook_list: hook_list = new Map();

for (const [id, pack] of registry.packs)
{
    if (pack.hooks)
    {
        empty_hook_list.set(id, new Map(pack.hooks));
    }
}

// ── 2. Create World ──────────────────────────────────────────────────────────
export const sp = new space([64, 64, 4]);
export const world = new pure_world(sp, empty_hook_list, 'world_1');

// ── 3. Run World / Local Init ────────────────────────────────────────────────
for (const pack of ENABLED_PACKS)
{
    pack.local_init(world);
}

// ── 4. Verify Trigger Event ──────────────────────────────────────────────────
world.trigger({ namespace: 'empty_pack', id: 'foo' });