// @vitest-environment happy-dom
import { it, expect } from 'vitest';
import * as core from '@/core';
import * as world from '@/world';
import * as panel from '@/packs/panel';
import * as panel_demo from '@/packs/panel_demo';

it('panel_demo mounts its layout and the toggle buttons collapse panels', () =>
{
    document.body.innerHTML = '<div id="app"></div>';
    const catalog = world.compose([panel.manifest, panel_demo.manifest]);
    const w = new world.pure_world(catalog, new core.space([4, 4]), 'demo');
    const root = panel.mount_ui_root(document.getElementById('app')!, w, panel_demo.layout);
    panel_demo.wire_controls(root);

    const mine = root.panels.get('panel_demo')!;
    expect([...mine.keys()].sort()).toEqual(['explorer', 'inspector', 'log', 'world']);
    expect(mine.get('world')!.content.textContent).toContain('world: demo');

    const button = document.querySelector<HTMLButtonElement>('[data-panel_demo_toggle="explorer"]')!;
    button.click();
    expect(mine.get('explorer')!.is_collapsed()).toBe(true);
    button.click();
    expect(mine.get('explorer')!.is_collapsed()).toBe(false);
});
