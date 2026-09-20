import * as core from '@/core';
import * as world from '@/world';
import * as cli from '@/packs/cli';
import * as panel from '@/packs/panel';
import * as gpts_ui from '@/packs/gpts_ui';
import * as test from '@/packs/test';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import * as vanilla_beta from '@/packs/vanilla_beta';

const registry: core.pack_registry = new Map();

vanilla_alpha.global_init(registry);
vanilla_beta.global_init(registry);
cli.global_init(registry);
panel.global_init(registry);
test.global_init(registry);
gpts_ui.global_init(registry);

const hook_template: core.hook_list = new Map();
for (const [namespace, pack] of registry)
{
    if (!pack.hooks)
    {
        continue;
    }

    const hooks = new Map<string, core.hook_callback[]>();
    for (const [id, callbacks] of pack.hooks)
    {
        hooks.set(id, [...callbacks]);
    }
    hook_template.set(namespace, hooks);
}

const app = document.getElementById('app');
if (!app)
{
    throw new Error('#app not found.');
}
app.replaceChildren();

const target_world = new world.pure_world(
    new core.space([64, 64, 4]),
    registry,
    hook_template,
    'main'
);

gpts_ui.create_ui_layout(target_world, app);
document.title = '';
