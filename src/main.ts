import * as core from '@/core';
import * as world from '@/world';

import * as vanilla_alpha from '@/packs/vanilla_alpha'
import * as cli from '@/packs/cli';

// ── 1. Compose, 依序組裝所有 pack ─────────────────────────────────────────────
const ENABLED_PACKS: core.pack_manifest[] =
[
    vanilla_alpha.manifest,
    cli.manifest
];

const catalog = world.compose(ENABLED_PACKS);

// ── 2. Create World ──────────────────────────────────────────────────────────
const sp = new core.space([64, 64, 4]);
new world.pure_world(catalog, sp, 'wwworld');
