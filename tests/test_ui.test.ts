// @vitest-environment happy-dom
import { it, expect } from 'vitest';
import * as core from '@/core';
import * as world from '@/world';
import * as cli from '@/packs/cli';
import * as panel from '@/packs/panel';
import * as test_ui from '@/packs/test_ui';

function enter(input: HTMLInputElement, line: string): void
{
    input.value = line;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
}

it('test_ui runs cli lines and keeps the history tree in sync', () =>
{
    document.body.innerHTML = '<div id="app"></div>';
    const catalog = world.compose([cli.manifest, panel.manifest, test_ui.manifest]);
    const w = new world.pure_world(catalog, new core.space([4, 4]), 'ui');
    panel.mount_ui_root(document.getElementById('app')!, w, test_ui.layout);

    const input = document.querySelector<HTMLInputElement>('[data-test_ui_cli_input]')!;
    const output = document.querySelector<HTMLElement>('[data-test_ui_cli_output]')!;
    const rows = () => [...document.querySelectorAll<HTMLElement>('[data-test_ui_history_node]')];

    enter(input, 'help');
    expect(output.textContent).toContain('test_ui:mark');
    enter(input, 'nope');
    expect(output.lastElementChild!.textContent).toMatch(/nope/);

    enter(input, 'mark a');
    enter(input, 'mark b');
    expect(rows().map(r => r.textContent)).toEqual(['○ root', '○ test_ui:mark a', '● test_ui:mark b']);

    rows()[1].click();
    enter(input, 'mark c');
    expect(rows().map(r => r.textContent)).toEqual(['○ root', '○ test_ui:mark a', '○ test_ui:mark b', '● test_ui:mark c']);
    expect(w.history.nodes.get(rows()[1].dataset.test_ui_history_node!)!.children_history_uids).toHaveLength(2);
});
