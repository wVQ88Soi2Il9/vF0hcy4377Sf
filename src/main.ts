import * as core from '@/core';
import * as world from '@/world';

import * as vanilla_alpha from '@/packs/vanilla_alpha'
import * as vanilla_beta from '@/packs/vanilla_beta';
import * as cli from '@/packs/cli';
import * as basic_ui from '@/packs/panel';
import * as basic_ui_demo from '@/packs/basic_ui_demo';

// ── 1. Compose, 依序組裝所有 pack ─────────────────────────────────────────────
const ENABLED_PACKS: core.pack_manifest[] =
[
    vanilla_alpha.manifest,
    vanilla_beta.manifest,
    cli.manifest,
    basic_ui.manifest,
    basic_ui_demo.manifest
];

const catalog = world.compose(ENABLED_PACKS);

// ── 2. Create World ──────────────────────────────────────────────────────────
const sp = new core.space([64, 64, 4]);
const main_world = new world.pure_world(catalog, sp, 'wwworld');

// ── 3. Mount UI ──────────────────────────────────────────────────────────────
const root = basic_ui.mount_ui_root(document.getElementById('app')!, main_world, basic_ui_demo.layout);
basic_ui_demo.wire_controls(root);
