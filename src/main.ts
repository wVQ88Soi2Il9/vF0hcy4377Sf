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

/**
 * 依據已就緒之 pack_registry，建構出完整的全域空 Hook 槽位清單（階段 3）。
 * 直接對齊並照搬各 Pack 所宣告之 Hook Map。
 */
export function build_empty_hook_list(reg: pack_registry): hook_list
{
    const hooks: hook_list = new Map();
    for (const [id, pack] of reg.packs)
    {
        if (pack.hooks)
        {
            hooks.set(id, new Map(pack.hooks));
        }
    }
    return hooks;
}

export const empty_hook_list: hook_list = build_empty_hook_list(registry);

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