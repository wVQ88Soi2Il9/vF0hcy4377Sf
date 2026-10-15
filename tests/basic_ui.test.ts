// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import * as core from '@/core';
import * as world from '@/world';
import * as basic_ui from '@/packs/basic_ui';

const min_size = { width: 100, height: 50 };
const max_size = { width: 300, height: 200 };

function pointer(target: EventTarget, type: string, x: number, y: number): void
{
    target.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true }));
}

function rect_of(el: HTMLElement, width: number, height: number): void
{
    el.getBoundingClientRect = () => ({ width, height } as DOMRect);
}

beforeEach(() =>
{
    document.body.innerHTML = '';
});

describe('basic_ui panel', () =>
{
    it('starts at min_size and accepts any element as content', () =>
    {
        const content = document.createElement('canvas');
        const p = basic_ui.create_panel(content, { edges: [], min_size, max_size });
        expect(p.content).toBe(content);
        expect(p.element.contains(content)).toBe(true);
        expect(p.get_size()).toEqual(min_size);
        expect(p.element.style.width).toBe('100px');
    });

    it('rejects bad options', () =>
    {
        const div = () => document.createElement('div');
        expect(() => basic_ui.create_panel(div(), { edges: ['left', 'left'], min_size, max_size })).toThrow(/Duplicate edge/);
        expect(() => basic_ui.create_panel(div(), { edges: ['middle' as basic_ui.edge], min_size, max_size })).toThrow(/Unknown edge/);
        expect(() => basic_ui.create_panel(div(), { edges: [], min_size: max_size, max_size: min_size })).toThrow(/must not exceed/);
        expect(() => basic_ui.create_panel(div(), { edges: [], min_size: { width: -1, height: 0 }, max_size })).toThrow(/non-negative/);
    });

    it('set_size throws outside the limits', () =>
    {
        const p = basic_ui.create_panel(document.createElement('div'), { edges: [], min_size, max_size });
        p.set_size({ width: 200, height: 100 });
        expect(p.get_size()).toEqual({ width: 200, height: 100 });
        expect(() => p.set_size({ width: 400, height: 100 })).toThrow(/outside/);
        expect(p.get_size()).toEqual({ width: 200, height: 100 });
    });

    it('resizes only from the listed edges and clamps while dragging', () =>
    {
        const p = basic_ui.create_panel(document.createElement('div'), { edges: ['right', 'top'], min_size, max_size });
        document.body.appendChild(p.element);
        const handles = [...p.element.querySelectorAll<HTMLElement>('[data-basic_ui_handle]')];
        expect(handles.map(h => h.dataset.basic_ui_handle)).toEqual(['right', 'top']);

        pointer(handles[0], 'pointerdown', 0, 0);
        pointer(document, 'pointermove', 50, 0);
        expect(p.get_size()).toEqual({ width: 150, height: 50 });
        pointer(document, 'pointermove', 1000, 0);
        expect(p.get_size().width).toBe(300);
        pointer(document, 'pointerup', 1000, 0);
        pointer(document, 'pointermove', 0, 0);
        expect(p.get_size().width).toBe(300);

        pointer(handles[1], 'pointerdown', 0, 0);
        pointer(document, 'pointermove', 0, -30);
        pointer(document, 'pointerup', 0, -30);
        expect(p.get_size()).toEqual({ width: 300, height: 80 });
    });

    it('resize_by_edge grows left and top in the opposite direction', () =>
    {
        const start = { width: 200, height: 100 };
        expect(basic_ui.resize_by_edge(start, 'left', 20, 0, min_size, max_size).width).toBe(180);
        expect(basic_ui.resize_by_edge(start, 'bottom', 0, -80, min_size, max_size).height).toBe(50);
    });

    it('collapses and restores its size', () =>
    {
        const p = basic_ui.create_panel(document.createElement('div'), { edges: ['right'], min_size, max_size });
        p.set_size({ width: 250, height: 120 });
        p.set_collapsed(true);
        expect(p.is_collapsed()).toBe(true);
        expect(p.content.hidden).toBe(true);
        expect(p.element.style.width).toBe('');
        p.set_collapsed(false);
        expect(p.content.hidden).toBe(false);
        expect(p.element.style.width).toBe('250px');
        expect(p.get_size()).toEqual({ width: 250, height: 120 });
    });
});

describe('basic_ui splitter', () =>
{
    it('split keeps the total and respects both minimums', () =>
    {
        expect(basic_ui.split(300, 100, 50, 50, 50)).toEqual([150, 150]);
        expect(basic_ui.split(300, 100, 500, 50, 80)).toEqual([220, 80]);
        expect(basic_ui.split(300, 100, -500, 50, 80)).toEqual([50, 250]);
        expect(() => basic_ui.split(100, 50, 0, 60, 60)).toThrow(/less than/);
    });

    it('sits between adjacent siblings and moves both sides', () =>
    {
        const a = document.createElement('div');
        const b = document.createElement('div');
        document.body.append(a, b);
        rect_of(a, 200, 10);
        rect_of(b, 100, 10);

        const s = basic_ui.create_splitter(a, b, { axis: 'x', min_a: 50, min_b: 50 });
        expect(a.nextElementSibling).toBe(s.element);
        expect(s.element.nextElementSibling).toBe(b);

        pointer(s.element, 'pointerdown', 0, 0);
        pointer(document, 'pointermove', 80, 0);
        pointer(document, 'pointerup', 80, 0);
        expect(a.style.flex).toBe('0 0 250px');
        expect(b.style.flex).toBe('0 0 50px');
    });

    it('rejects non-adjacent elements', () =>
    {
        const a = document.createElement('div');
        const b = document.createElement('div');
        expect(() => basic_ui.create_splitter(a, b, { axis: 'x', min_a: 0, min_b: 0 })).toThrow(/adjacent/);
        document.body.append(b, a);
        expect(() => basic_ui.create_splitter(a, b, { axis: 'x', min_a: 0, min_b: 0 })).toThrow(/adjacent/);
    });
});

function make_world(manifests: core.pack_manifest[]): world.pure_world
{
    return new world.pure_world(world.compose([basic_ui.manifest, ...manifests]), new core.space([4, 4]));
}

function panel_pack(pack_id: string, panels: Record<string, unknown>): core.pack_manifest
{
    return { pack_id, provides: { other_info: { basic_ui: { panels } } } };
}

function declaration(label: string): basic_ui.panel_declaration
{
    return {
        render: () =>
        {
            const el = document.createElement('section');
            el.textContent = label;
            return el;
        },
        edges: ['right'],
        min_size,
        max_size
    };
}

describe('basic_ui extensions', () =>
{
    it('lists panels in registry order and skips packs without basic_ui info', () =>
    {
        const w = make_world([panel_pack('a', { left: declaration('a') }), { pack_id: 'plain' }, panel_pack('b', { log: declaration('b') })]);
        expect(basic_ui.list_panels(w.catalog.registry).map(e => `${e.pack_id}:${e.name}`)).toEqual(['a:left', 'b:log']);
    });

    it('rejects malformed declarations', () =>
    {
        const list = (m: core.pack_manifest) => () => basic_ui.list_panels(make_world([m]).catalog.registry);
        expect(list({ pack_id: 'x', provides: { other_info: { basic_ui: { panels: {}, other: 1 } } } })).toThrow(/unknown key "other"/);
        expect(list({ pack_id: 'x', provides: { other_info: { basic_ui: {} } } })).toThrow(/panels must be an object/);
        expect(list(panel_pack('x', { p: { edges: [], min_size, max_size } }))).toThrow(/render/);
        expect(list(panel_pack('x', { p: { render: () => null, edges: [] } }))).toThrow(/min_size/);
        expect(list(panel_pack('x', { p: { ...declaration('p'), edges: ['up'] } }))).toThrow(/x:p.*Unknown edge/);
    });
});

describe('basic_ui root', () =>
{
    it('mounts registered panels into the given container', () =>
    {
        const container = document.createElement('main');
        document.body.appendChild(container);
        const w = make_world([panel_pack('a', { left: declaration('hello') })]);
        const root = basic_ui.mount_ui_root(container, w);

        expect(container.firstElementChild).toBe(root.element);
        const p = root.panels.get('a')!.get('left')!;
        expect(p.element.parentElement).toBe(root.element);
        expect(p.element.dataset.basic_ui_pack).toBe('a');
        expect(p.element.dataset.basic_ui_name).toBe('left');
        expect(p.content.textContent).toBe('hello');
    });

    it('is unique per document', () =>
    {
        const w = make_world([]);
        basic_ui.mount_ui_root(document.body, w);
        expect(() => basic_ui.mount_ui_root(document.body, w)).toThrow(/already mounted/);
    });

    it('leaves the container untouched when a panel fails to render', () =>
    {
        const bad = { ...declaration('bad'), render: () => 'text' as unknown as HTMLElement };
        const w = make_world([panel_pack('a', { ok: declaration('ok'), bad })]);
        expect(() => basic_ui.mount_ui_root(document.body, w)).toThrow(/a:bad.*HTMLElement/);
        expect(document.body.children.length).toBe(0);
    });
});
