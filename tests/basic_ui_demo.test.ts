// @vitest-environment happy-dom
import { it, expect } from 'vitest';
import * as core from '@/core';
import * as world from '@/world';
import * as basic_ui from '@/packs/basic_ui';
import * as basic_ui_demo from '@/packs/basic_ui_demo';

it('basic_ui_demo mounts its layout and the toggle buttons collapse panels', () =>
{
    document.body.innerHTML = '<div id="app"></div>';
    const catalog = world.compose([basic_ui.manifest, basic_ui_demo.manifest]);
    const w = new world.pure_world(catalog, new core.space([4, 4]), 'demo');
    const root = basic_ui.mount_ui_root(document.getElementById('app')!, w, basic_ui_demo.layout);
    basic_ui_demo.wire_controls(root);

    const mine = root.panels.get('basic_ui_demo')!;
    expect([...mine.keys()].sort()).toEqual(['explorer', 'inspector', 'log', 'world']);
    expect(mine.get('world')!.content.textContent).toContain('world: demo');

    const button = document.querySelector<HTMLButtonElement>('[data-basic_ui_demo_toggle="explorer"]')!;
    button.click();
    expect(mine.get('explorer')!.is_collapsed()).toBe(true);
    button.click();
    expect(mine.get('explorer')!.is_collapsed()).toBe(false);
});
