import * as core from '@/core';
import { pure_world } from '@/world';
import * as alpha from '@/packs/vanilla_alpha';
import * as beta from '@/packs/vanilla_beta';
import * as cli from '@/packs/cli';
import { create_ui_layout, global_init } from './index';

const registry: core.pack_registry = new Map();
alpha.global_init(registry);
beta.global_init(registry);
cli.global_init(registry);
global_init(registry);
const hooks: core.hook_list = new Map();
for (const [id, pack] of registry)
{
    if (pack.hooks) { hooks.set(id, new Map([...pack.hooks].map(([name]) => [name, []]))); }
}
const target_world = new pure_world(new core.space([64, 64, 4]), registry, hooks);
create_ui_layout(target_world);
