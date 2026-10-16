import * as core from '@/core';
import * as world from '@/world';

import * as vanilla_alpha from '@/packs/vanilla_alpha'
import * as vanilla_beta from '@/packs/vanilla_beta';
import * as vanilla_gamma from '@/packs/vanilla_gamma';
import * as cli from '@/packs/cli';
import * as panel from '@/packs/panel';
import * as camera from '@/packs/camera';
import * as test_ui from '@/packs/test_ui';

// ── 1. Compose, 依序組裝所有 pack ─────────────────────────────────────────────
const ENABLED_PACKS: core.pack_manifest[] =
[
    vanilla_alpha.manifest,
    vanilla_beta.manifest,
    vanilla_gamma.manifest,
    cli.manifest,
    panel.manifest,
    camera.manifest,
    test_ui.manifest
];

const catalog = world.compose(ENABLED_PACKS);

// ── 2. Create World ──────────────────────────────────────────────────────────
const sp = new core.space([64, 64, 4]);
const main_world = new world.pure_world(catalog, sp, 'wwworld');

// ── 3. Mount UI ──────────────────────────────────────────────────────────────
panel.mount_ui_root(document.getElementById('app')!, main_world, test_ui.layout);
