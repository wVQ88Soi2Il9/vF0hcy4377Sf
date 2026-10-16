// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import * as core from '@/core';
import * as world from '@/world';
import * as cli from '@/packs/cli';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import * as vanilla_beta from '@/packs/vanilla_beta';
import * as panel from '@/packs/panel';
import * as test_ui from '@/packs/test_ui';
import * as camera from '@/packs/camera';
import * as basic_renderer from '@/packs/basic_renderer';
import * as cuboid_device from '@/packs/cuboid_device';

function enter(input: HTMLInputElement, line: string): void
{
    input.value = line;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
}

it('test_ui runs cli lines and keeps the history tree in sync', () =>
{
    document.body.innerHTML = '<div id="app"></div>';
    const catalog = world.compose([cli.manifest, panel.manifest, camera.manifest, test_ui.manifest]);
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

class box_device extends basic_renderer.drawable(cuboid_device.base_cuboid_device)
{
    public readonly device_size: core.vector = [2, 2, 2];
    public get_port(): core.port[] { return []; }
    public draw(item: basic_renderer.projected_device, cell_px: number): SVGElement
    {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.dataset.cells = item.cells.map(c => c.join(',')).join(';');
        g.dataset.cell_px = String(cell_px);
        return g;
    }
}

it('test_ui view draws the camera projection and redraws on committed', () =>
{
    document.body.innerHTML = '<div id="app"></div>';
    const catalog = world.compose([cli.manifest, panel.manifest, camera.manifest, test_ui.manifest]);
    const w = new world.pure_world(catalog, new core.space([8, 4, 4]), 'ui');
    panel.mount_ui_root(document.getElementById('app')!, w, test_ui.layout);

    const svg = () => document.querySelector<SVGSVGElement>('[data-test_ui_view]')!;
    expect(svg().children[0].tagName).toBe('rect');
    expect(svg().children[0].getAttribute('width')).toBe('64');
    expect(svg().children[0].getAttribute('height')).toBe('32');

    const def: core.namespaced_id = { namespace: 'test', id: 'box' };
    w.space.devices.set('a'.repeat(16), new box_device('a'.repeat(16), def, [2, 0, 0]));
    w.space.devices.set('b'.repeat(16), new box_device('b'.repeat(16), def, [4, 0, 2]));
    const input = document.querySelector<HTMLInputElement>('[data-test_ui_cli_input]')!;
    enter(input, 'mark');

    const drawn = () => [...svg().querySelectorAll<SVGElement>('[data-cells]')];
    expect(drawn()).toHaveLength(1);
    expect(drawn()[0].dataset.cells).toBe('2,0');
    expect(drawn()[0].dataset.cell_px).toBe('16');

    w.undo();
    expect(drawn()).toHaveLength(1);
    w.space.devices.delete('a'.repeat(16));
    w.redo();
    expect(drawn()).toHaveLength(0);
});

describe('test_ui view camera controls', () =>
{
    function mount(size: core.vector): world.pure_world
    {
        document.body.innerHTML = '<div id="app"></div>';
        const catalog = world.compose([vanilla_alpha.manifest, vanilla_beta.manifest, cli.manifest, panel.manifest, camera.manifest, test_ui.manifest]);
        const w = new world.pure_world(catalog, new core.space(size), 'ui');
        panel.mount_ui_root(document.getElementById('app')!, w, test_ui.layout);
        return w;
    }

    const svg = () => document.querySelector<SVGSVGElement>('[data-test_ui_view]')!;
    const fill = () => svg().style.getPropertyValue('--test_ui_device_fill');
    const shown = () => [...svg().querySelectorAll<SVGElement>('[data-test_ui_device]')].map(g => g.dataset.test_ui_device);
    const axis_select = (index: number) => document.querySelector<HTMLSelectElement>(`[data-test_ui_view_axis="${index}"]`)!;
    const slice_input = (axis: number) => document.querySelector<HTMLInputElement>(`[data-test_ui_view_slice="${axis}"]`);

    function change(el: HTMLInputElement | HTMLSelectElement, value: string): void
    {
        el.value = value;
        el.dispatchEvent(new Event('change'));
    }

    it('edit panel creates, moves and deletes devices from the menus', () =>
    {
        const w = mount([8, 8, 4]);
        const op = document.querySelector<HTMLSelectElement>('[data-test_ui_edit_op]')!;
        const target = document.querySelector<HTMLSelectElement>('[data-test_ui_edit_target]')!;
        const pos = document.querySelector<HTMLInputElement>('[data-test_ui_edit_pos]')!;
        const status = document.querySelector<HTMLElement>('[data-test_ui_edit_status]')!;
        const positions = () => [...w.space.devices.values()].map(d => d.position);

        expect([...target.options].map(o => o.value)).toEqual(expect.arrayContaining(['test_ui:box', 'test_ui:bar', 'test_ui:slab']));
        target.value = 'test_ui:bar';
        enter(pos, '2 0 0');
        expect(status.textContent).toMatch(/submitted/);
        expect(positions()).toEqual([[2, 0, 0]]);
        expect(shown()).toHaveLength(1);
        enter(pos, '1 0 0');
        expect(status.textContent).toMatch(/even/);
        expect(w.space.devices.size).toBe(1);

        change(op, 'move');
        const uid = [...w.space.devices.keys()][0];
        expect([...target.options].map(o => o.value)).toEqual([uid]);
        expect(target.options[0].textContent).toContain('test_ui:bar [2, 0, 0]');
        enter(pos, '4 2 0');
        expect(positions()).toEqual([[4, 2, 0]]);
        expect(target.options[0].textContent).toContain('[4, 2, 0]');

        change(op, 'delete');
        expect(pos.disabled).toBe(true);
        document.querySelector<HTMLButtonElement>('[data-test_ui_edit_run]')!.click();
        expect(w.space.devices.size).toBe(0);
        expect(target.options).toHaveLength(0);
        document.querySelector<HTMLButtonElement>('[data-test_ui_edit_run]')!.click();
        expect(status.textContent).toBe('no device to delete');
    });

    it('creates demo boxes from the cli and moves the slice through layers', () =>
    {
        const w = mount([8, 8, 4]);
        const input = document.querySelector<HTMLInputElement>('[data-test_ui_cli_input]')!;
        enter(input, 'create_device test_ui:box 0 0 0');
        enter(input, 'create_device test_ui:box 2 2 2');
        const [low, high] = [...w.space.devices.keys()];
        expect(shown()).toEqual([low]);

        change(slice_input(2)!, '3');
        expect(shown()).toEqual([high]);
        change(slice_input(2)!, '2');
        expect(shown()).toEqual([low, high]);
    });

    it('view cli sets axes and slices and syncs the controls', () =>
    {
        mount([8, 8, 4, 4]);
        const input = document.querySelector<HTMLInputElement>('[data-test_ui_cli_input]')!;
        const output = document.querySelector<HTMLElement>('[data-test_ui_cli_output]')!;
        const last = () => output.lastElementChild!.textContent;

        enter(input, 'view');
        expect(last()).toBe('view d0 d1 d2=1 d3=1');
        enter(input, 'view d3=2');
        expect(last()).toBe('view d0 d1 d2=1 d3=2');
        expect(slice_input(3)!.value).toBe('2');
        enter(input, 'view d2 d0 d1=3');
        expect(last()).toBe('view d2 d0 d1=3 d3=2');
        expect([axis_select(0).value, axis_select(1).value]).toEqual(['2', '0']);
        expect(document.querySelector('[data-test_ui_axis_h]')!.textContent).toBe('d2 →');

        for (const bad of ['view d0', 'view d0 d0', 'view d1=9', 'view d2=1', 'view x'])
        {
            enter(input, bad);
            expect(last()).not.toMatch(/^view d/);
        }
        enter(input, 'view');
        expect(last()).toBe('view d2 d0 d1=3 d3=2');
    });

    it('switching axes swaps on collision and turns the old view axis into a slice', () =>
    {
        mount([8, 8, 4]);
        const label = (which: string) => document.querySelector<HTMLElement>(`[data-test_ui_axis_${which}]`)!.textContent;
        expect([label('h'), label('v')]).toEqual(['d0 →', 'd1 →']);
        change(axis_select(0), '1');
        expect(axis_select(0).value).toBe('1');
        expect(axis_select(1).value).toBe('0');
        expect([label('h'), label('v')]).toEqual(['d1 →', 'd0 →']);
        expect(slice_input(2)!.value).toBe('1');

        change(axis_select(1), '2');
        expect(slice_input(2)).toBeNull();
        expect(slice_input(0)!.value).toBe('1');
        expect(svg().children[0].getAttribute('width')).toBe('64');
        expect(svg().children[0].getAttribute('height')).toBe('32');
    });

    it('device colour follows the view axes and the slice depth', () =>
    {
        mount([8, 8, 4]);
        const top = fill();
        change(axis_select(1), '2');
        const side = fill();
        expect(side).not.toBe(top);

        change(axis_select(1), '1');
        expect(fill()).toBe(top);
        change(slice_input(2)!, '3');
        expect(fill()).not.toBe(top);
        expect(fill().split(',')[0]).toBe(top.split(',')[0]);
    });

    it('clips cells outside the view in the ui and skips devices left with none', () =>
    {
        const w = mount([8, 8, 4]);
        const def: core.namespaced_id = { namespace: 'test', id: 'box' };
        class wide_device extends box_device
        {
            public readonly device_size: core.vector = [4, 2, 2];
        }
        w.space.devices.set('a'.repeat(16), new wide_device('a'.repeat(16), def, [6, 0, 0]));
        w.space.devices.set('b'.repeat(16), new box_device('b'.repeat(16), def, [8, 0, 0]));
        w.space.devices.set('c'.repeat(16), new box_device('c'.repeat(16), def, [-2, 6, 0]));
        enter(document.querySelector<HTMLInputElement>('[data-test_ui_cli_input]')!, 'mark');

        const drawn = [...svg().querySelectorAll<SVGElement>('[data-cells]')];
        expect(drawn).toHaveLength(1);
        expect(drawn[0].dataset.cells).toBe('6,0');
    });

    // happy-dom 不排版：手動給 view 一個畫面大小，再觸發重畫
    function size_view(width: number, height: number): void
    {
        Object.defineProperty(svg(), 'clientWidth', { configurable: true, value: width });
        Object.defineProperty(svg(), 'clientHeight', { configurable: true, value: height });
        enter(document.querySelector<HTMLInputElement>('[data-test_ui_cli_input]')!, 'mark');
    }

    const view_box = () => svg().getAttribute('viewBox')!.split(' ').map(Number);
    const grid_lines = () => [...svg().querySelectorAll<SVGLineElement>('[data-test_ui_grid] line')];

    it('has no viewBox until the view has a size, then fits the space', () =>
    {
        mount([8, 4, 4]);
        expect(svg().hasAttribute('viewBox')).toBe(false);
        size_view(400, 400);
        // 空間 8×4，一格 16px：render 單位 64×32，置中塞進正方形
        expect(view_box()).toEqual([0, -16, 64, 64]);
    });

    it('wheel zooms around the cursor and drag pans, without redrawing devices', () =>
    {
        const w = mount([8, 4, 4]);
        enter(document.querySelector<HTMLInputElement>('[data-test_ui_cli_input]')!, 'create_device test_ui:box 2 0 0');
        size_view(400, 400);
        const layer = svg().querySelector('[data-test_ui_layer]');

        // happy-dom 的 WheelEvent 不繼承 MouseEvent，沒有 clientX/clientY，手動補上
        const wheel = new WheelEvent('wheel', { deltaY: -1000 * Math.log(2) / 1.5, cancelable: true });
        Object.defineProperties(wheel, { clientX: { value: 0 }, clientY: { value: 0 } });
        svg().dispatchEvent(wheel);
        expect(wheel.defaultPrevented).toBe(true);
        const zoomed = view_box();
        expect(zoomed[0]).toBeCloseTo(0);
        expect(zoomed[1]).toBeCloseTo(-16);
        expect(zoomed[2]).toBeCloseTo(32);

        svg().dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }));
        window.dispatchEvent(new MouseEvent('mouseup'));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 400 }));
        const panned = view_box();
        expect(panned[0]).toBeCloseTo(-8);
        expect(panned[1]).toBeCloseTo(-16);
        expect(svg().querySelector('[data-test_ui_layer]')).toBe(layer);
        expect(w.space.devices.size).toBe(1);
    });

    it('draws one grid line per cell boundary in the visible window, also outside the space', () =>
    {
        mount([8, 4, 4]);
        expect(grid_lines()).toHaveLength(0);
        size_view(400, 400);
        // viewBox [0, -16, 64, 64]，一格 16：x = 0..64 共 5 條，y = -16..48 共 5 條
        const lines = grid_lines();
        expect(lines.filter(l => l.getAttribute('x1') === l.getAttribute('x2')).map(l => Number(l.getAttribute('x1'))))
            .toEqual([0, 16, 32, 48, 64]);
        expect(lines.filter(l => l.getAttribute('y1') === l.getAttribute('y2')).map(l => Number(l.getAttribute('y1'))))
            .toEqual([-16, 0, 16, 32, 48]);
        expect(lines[0].getAttribute('vector-effect')).toBe('non-scaling-stroke');
    });

    it('follows pan and hides the grid when zoomed out too far', () =>
    {
        mount([8, 4, 4]);
        size_view(400, 400);
        svg().dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 0 }));
        window.dispatchEvent(new MouseEvent('mouseup'));
        const xs = grid_lines().filter(l => l.getAttribute('x1') === l.getAttribute('x2')).map(l => Number(l.getAttribute('x1')));
        expect(xs).toEqual([0, 16, 32, 48]);

        const wheel = new WheelEvent('wheel', { deltaY: 3000, cancelable: true });
        Object.defineProperties(wheel, { clientX: { value: 0 }, clientY: { value: 0 } });
        svg().dispatchEvent(wheel);
        expect(grid_lines()).toHaveLength(0);
    });

    it('pans outside the space and the fit button brings the whole space back', () =>
    {
        mount([8, 4, 4]);
        size_view(400, 400);
        svg().dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: -5000, clientY: -5000 }));
        window.dispatchEvent(new MouseEvent('mouseup'));
        expect(view_box()[0]).toBeGreaterThan(64);

        document.querySelector<HTMLButtonElement>('[data-test_ui_view_fit]')!.click();
        expect(view_box()).toEqual([0, -16, 64, 64]);
    });

    it('keeps pan and zoom when the view axes change', () =>
    {
        mount([8, 4, 4]);
        size_view(400, 400);
        svg().dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 0 }));
        window.dispatchEvent(new MouseEvent('mouseup'));
        const before = view_box();
        change(axis_select(1), '2');
        expect(view_box()).toEqual(before);
    });

    it('rejects an out-of-range slice and keeps the previous view', () =>
    {
        mount([8, 8, 4]);
        const el = slice_input(2)!;
        el.value = '9';
        expect(() => dispatch_change_rethrow(el)).toThrow();
        expect(slice_input(2)!.value).toBe('1');
    });
});

function dispatch_change_rethrow(el: HTMLInputElement): void
{
    // listener 的例外不會傳回 dispatchEvent，改由 window error 事件取回
    let thrown: unknown;
    const on_error = (event: ErrorEvent) => { thrown = event.error; event.preventDefault(); };
    window.addEventListener('error', on_error);
    el.dispatchEvent(new Event('change'));
    window.removeEventListener('error', on_error);
    if (thrown !== undefined)
    {
        throw thrown;
    }
}

describe('test_ui.view_color', () =>
{
    const target = new core.space([8, 8, 4]);

    it('treats reversed axes as the same face', () =>
    {
        expect(test_ui.view_color(target, { axes: [0, 1], slice: { 2: 1 } }))
            .toBe(test_ui.view_color(target, { axes: [1, 0], slice: { 2: 1 } }));
    });

    it('gives every axis pair its own hue and darkens deeper slices', () =>
    {
        const hues = [[0, 1, 2], [0, 2, 1], [1, 2, 0]].map(([h, v, s]) =>
            test_ui.view_color(target, { axes: [h, v], slice: { [s]: 1 } }).split(',')[0]);
        expect(new Set(hues).size).toBe(3);
        const light = (z: number) => Number(test_ui.view_color(target, { axes: [0, 1], slice: { 2: z } }).match(/(\d+)%\)$/)![1]);
        expect(light(0)).toBeGreaterThan(light(2));
        expect(light(2)).toBeGreaterThan(light(4));
    });
});
