import * as core from '../../src/core';
import { pure_world } from '../../src/world';
import * as alpha from '../../src/packs/vanilla_alpha';
import { create_ui_layout, create_extensions } from '../../src/packs/gpts_ui';
import * as actual_test_pack from '../../src/packs/test';

const results: string[] = [];
function check(condition: unknown, label: string): void
{
    if (!condition) { throw new Error(label); }
    results.push(`PASS ${label}`);
}
function click(root: HTMLElement, title: string): void
{
    const control = [...root.querySelectorAll('button')].find(node => node.title === title);
    if (!control) { throw new Error(`Button missing: ${title}`); }
    control.click();
}
function select(root: HTMLElement, label: string, value: string): void
{
    const input = root.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event('change'));
}
class test_device extends core.device
{
    get_shape() { return [[0, 0, 0]]; }
    get_port(): core.port[] { return [{ port_uid: 7, offset: [0, 0, 0], direction: 'bidirectional' }]; }
    validate() { return true; }
}
function make_world(): pure_world
{
    const registry: core.pack_registry = new Map();
    alpha.global_init(registry);
    registry.set('test', { pack_id: 'test', devices: { machine: test_device },
        recipes: { recipe: { namespace: 'test', id: 'recipe', evaluate: () => [] } },
        commands: { echo: { namespace: 'test', id: 'echo', execute: () => 'hello' } } });
    const hooks: core.hook_list = new Map();
    for (const [name, pack] of registry)
    {
        if (pack.hooks) { hooks.set(name, new Map([...pack.hooks].map(([id]) => [id, []]))); }
    }
    return new pure_world(new core.space([64, 64, 4]), registry, hooks);
}
try
{
    const actual_registry: core.pack_registry = new Map();
    actual_test_pack.global_init(actual_registry);
    const registered_test = actual_registry.get('test')!;
    check(Object.keys(registered_test.devices ?? {}).length === 6, 'test pack registers six devices');
    check(Object.keys(registered_test.recipes ?? {}).join() === 'advanced_circuit,iron_gear', 'test pack registers two recipes');
    const assembler = new actual_test_pack.assembler_device(1, { namespace: 'test', id: 'assembler' }, [0, 0, 0]);
    check(assembler.get_shape().length === 4 && assembler.get_port().length === 3, 'test assembler preserves shape and ports');
    check(assembler.draw().childElementCount === 5, 'test assembler uses current HTML renderer contract');
    const pipe = new actual_test_pack.pipe_device(2, { namespace: 'test', id: 'pipe' }, [0, 0, 0], {
        segments: [{ axis: 0, delta: 4 }, { axis: 1, delta: 2 }]
    });
    check(pipe.get_shape().length === 4 && pipe.get_port().length === 2, 'test pipe expands segments and exposes endpoints');
    const recipe_result = registered_test.recipes!.iron_gear.evaluate(1);
    check(typeof recipe_result !== 'string' && recipe_result[0].port_uid === 1, 'test recipe uses current output contract');
    const world = make_world();
    const extensions = create_extensions();
    let inspector_calls = 0;
    let action_calls = 0;
    const dispose_inspector = extensions.register_device_inspector(dev => dev.definition_id.namespace === 'test', () => { inspector_calls++; });
    extensions.register_device_creation_option(id => id === 'test:machine', container =>
    {
        const input = document.createElement('input');
        input.value = 'retained';
        input.setAttribute('aria-label', 'Custom option');
        container.append(input);
        return { get_other_info: () => ({ custom: input.value }) };
    });
    extensions.register_device_action({ label: 'Custom action', on_click: () => { action_calls++; } });
    const old_dispose = extensions.register_panel_section('same', 0, () => {});
    extensions.register_panel_section('same', 2, container => { container.textContent = 'Custom section'; });
    extensions.register_panel_section('first', 1, () => {});
    old_dispose();
    check(extensions.get_panel_sections().map(entry => entry.id).join() === 'first,same', 'section ordering and stale unsubscribe preserve replacement');
    const ui = create_ui_layout(world, document.getElementById('app')!, extensions);
    const root = ui.root;
    check(ui.info_bar.is_collapsed() && ui.cad_timeline.is_collapsed() && ui.cli_bar.is_collapsed(), 'panels initially collapsed');
    check(root.textContent!.includes('Devices: 0') && root.textContent!.includes('64 × 64 × 4'), 'initial world statistics populated');
    check([...root.querySelectorAll<HTMLElement>('[role="separator"]')].every(handle => handle.hidden), 'collapsed splitters hidden');
    ui.info_bar.set_collapsed(false);
    check(Math.abs(ui.info_bar.element.getBoundingClientRect().width - 360) < 1, 'info expands to initial width');
    select(root, 'Pack namespace', 'test');
    select(root, 'Device definition', 'machine');
    const custom = root.querySelector<HTMLInputElement>('[aria-label="Custom option"]')!;
    custom.value = 'user value';
    ui.info_bar.refresh();
    check(root.querySelector<HTMLInputElement>('[aria-label="Custom option"]')!.value === 'user value', 'refresh preserves creation option edits');
    const creator = root.querySelector<HTMLElement>('.gpts_card')!;
    const x = creator.querySelector<HTMLInputElement>('input[type="number"]')!;
    x.value = '2.5';
    click(creator, 'Create');
    check(world.space.devices.length === 0 && !!creator.querySelector('.gpts_error')!.textContent, 'fractional coordinate rejected without mutation');
    x.value = '';
    click(creator, 'Increase coordinate 1 by 2');
    check(x.value === '', 'empty coordinate is not silently normalized');
    x.value = '-2';
    click(creator, 'Increase coordinate 1 by 2');
    click(creator, 'Create');
    check(world.space.devices.length === 1 && world.history.nodes.size === 2, 'create records one history node');
    check(world.space.devices[0].other_info?.custom === 'user value' && inspector_calls > 0, 'creation options and matching inspector run');
    check(root.textContent!.includes('#7 bidirectional') && root.textContent!.includes('VALID'), 'ports and optional validation displayed');
    let card = ui.info_bar.element.querySelectorAll<HTMLElement>('.gpts_card')[1];
    card.querySelector<HTMLInputElement>('input[type="number"]')!.value = '4';
    click(card, 'Move');
    check(world.space.devices[0].position[0] === 4, 'move updates world');
    select(root, 'Selected recipe', 'test:recipe');
    check(world.space.devices[0].selected_recipe_id?.id === 'recipe', 'recipe selection recorded');
    select(root, 'Selected recipe', '');
    check(world.space.devices[0].selected_recipe_id === undefined, 'recipe can be cleared');
    click(root, 'Custom action');
    check(action_calls === 1, 'custom action runs');
    click(root, 'Delete device');
    check(world.space.devices.length === 0 && !root.querySelector('[aria-label="Selected recipe"]'), 'delete clears inspector');
    click(ui.cad_timeline.element, 'Undo');
    check(world.space.devices.length === 1, 'undo restores deleted device');
    click(ui.cad_timeline.element, 'Redo');
    check(world.space.devices.length === 0, 'unambiguous redo replays deletion');
    click(ui.cad_timeline.element, 'Previous fork');
    check(world.history.current_history_uid === 0, 'previous fork reaches root on linear history');
    click(ui.cad_timeline.element, 'Next fork / end');
    check(world.history.current_history_uid === 5, 'next fork reaches linear branch end');
    click(ui.cad_timeline.element, 'Root');
    check(world.space.devices.length === 0, 'root navigation restores initial space');
    click(creator, 'Create');
    const branch_uid = world.history.current_history_uid;
    click(ui.cad_timeline.element, 'Root');
    check([...ui.cad_timeline.element.querySelectorAll('button')].find(node => node.title === 'Redo')!.disabled, 'redo disabled at ambiguous fork');
    check([...ui.cad_timeline.element.querySelectorAll('button')].find(node => node.title === 'Next fork / end')!.disabled, 'fast forward disabled at ambiguous fork');
    ui.cad_timeline.set_collapsed(false);
    const row = (uid: number) => root.querySelector<HTMLElement>(`[data-history-uid="${uid}"]`)!;
    check(row(0).classList.contains('gpts_current') && !!root.querySelector('.gpts_graph svg path'), 'history graph shows edges and HEAD');
    row(branch_uid).querySelector<HTMLButtonElement>('.gpts_history_label')!.click();
    check(world.history.current_history_uid === branch_uid && world.space.devices.length === 1, 'explicit branch jump restores selected branch');
    click(row(branch_uid), 'Pin');
    check(row(branch_uid).classList.contains('gpts_pinned'), 'pin rendered');
    check([...row(branch_uid).querySelectorAll('button')].find(node => node.title === 'Delete branch')!.disabled, 'active branch deletion disabled');
    click(row(1), 'Delete branch');
    check(!world.history.nodes.has(1) && world.history.nodes.has(branch_uid), 'inactive subtree pruned without affecting active branch');
    click(ui.cad_timeline.element, 'Root');
    row(branch_uid).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    check(!world.history.nodes.has(branch_uid) && world.history.nodes.has(0), 'right click deletes inactive leaf and preserves root');
    const input = ui.cli_bar.element.querySelector('input')!;
    input.value = 'test:echo';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    check(!ui.cli_bar.is_collapsed() && ui.cli_bar.element.textContent!.includes('hello') && !input.value, 'CLI success expands and clears input');
    input.value = 'missing';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    check(!!ui.cli_bar.element.querySelector('.gpts_error')?.textContent, 'CLI exception shown');
    ui.viewport_panel.update_zoom_ui(80);
    click(ui.viewport_panel.panel.element, 'Zoom in');
    check(ui.viewport_panel.panel.element.textContent!.includes('250%'), 'zoom buttons use externally updated value');
    for (let i = 0; i < 20; i++) { click(ui.viewport_panel.panel.element, 'Zoom in'); }
    check(ui.viewport_panel.panel.element.textContent!.includes('500%'), 'zoom upper bound');
    for (let i = 0; i < 30; i++) { click(ui.viewport_panel.panel.element, 'Zoom out'); }
    check(ui.viewport_panel.panel.element.textContent!.includes('25%'), 'zoom lower bound');
    click(ui.viewport_panel.panel.element, 'Reset zoom');
    check(ui.viewport_panel.panel.element.textContent!.includes('100%'), 'zoom reset');
    const other_world = make_world();
    const other = create_ui_layout(other_world);
    select(other.root, 'Pack namespace', 'test');
    select(other.root, 'Device definition', 'machine');
    click(other.root, 'Create');
    check(other_world.space.devices.length === 1 && world.space.devices.length === 0 && !other.root.textContent!.includes('Custom action'), 'world and extensions isolated between UI instances');
    const hook_count = () => [...world.current_hook.values()].flatMap(group => [...group.values()]).reduce((sum, list) => sum + list.length, 0);
    const before = hook_count();
    dispose_inspector();
    check(extensions.get_device_inspectors(other_world.space.devices[0]).length === 0, 'inspector unsubscribe');
    other.destroy();
    ui.destroy();
    check(hook_count() === before - 3 && !root.isConnected, 'destroy removes UI hooks and DOM');
    extensions.clear_all_extensions();
    check(extensions.get_device_actions().length === 0 && extensions.get_panel_sections().length === 0, 'extension teardown');
    // Leave a populated instance for pointer and visual checks through browser automation.
    const demo = create_ui_layout(make_world());
    demo.cad_timeline.set_collapsed(false);
    demo.info_bar.set_collapsed(false);
    demo.cli_bar.set_collapsed(false);
    (window as any).test_ui = demo;
    document.getElementById('results')!.textContent = `${results.join('\n')}\nALL ${results.length} PASSED`;
    document.title = 'PASS';
}
catch (cause)
{
    document.getElementById('results')!.textContent = `${results.join('\n')}\nFAIL ${cause instanceof Error ? cause.stack : cause}`;
    document.title = 'FAIL';
}
