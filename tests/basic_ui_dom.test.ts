// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as core from '@/core';
import * as world from '@/world';
import * as basic_ui from '@/packs/basic_ui';

// happy-dom 沒有版面計算：以假的 ResizeObserver 手動送出容器尺寸
class fake_observer
{
    static instances: fake_observer[] = [];
    readonly targets = new Set<Element>();
    constructor(private readonly callback: ResizeObserverCallback)
    {
        fake_observer.instances.push(this);
    }
    observe(target: Element): void
    {
        this.targets.add(target);
    }
    unobserve(target: Element): void
    {
        this.targets.delete(target);
    }
    disconnect(): void
    {
        this.targets.clear();
    }
    static resize(target: Element, width: number, height: number): void
    {
        for (const o of fake_observer.instances)
        {
            if (o.targets.has(target))
            {
                o.callback([{ target, contentRect: { width, height } } as unknown as ResizeObserverEntry], o as unknown as ResizeObserver);
            }
        }
    }
}

const original_observer = globalThis.ResizeObserver;

beforeEach(() =>
{
    document.body.innerHTML = '';
    fake_observer.instances = [];
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = fake_observer;
});

afterEach(() =>
{
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = original_observer;
});

function make_world(panels: Record<string, Record<string, () => HTMLElement>>): world.pure_world
{
    const manifests: core.pack_manifest[] = Object.entries(panels).map(([pack_id, by_name]) => ({
        pack_id,
        provides: { other_info: { basic_ui: { panels: Object.fromEntries(Object.entries(by_name).map(([n, render]) => [n, { render }])) } } }
    }));
    return new world.pure_world(world.compose([basic_ui.manifest, ...manifests]), new core.space([4, 4]));
}

const section = (text: string) => () =>
{
    const el = document.createElement('section');
    el.textContent = text;
    return el;
};

function leaf(namespace: string, id: string, size: number, min = 0, max = Infinity): basic_ui.layout_child
{
    return { node: { kind: 'panel', panel: { namespace, id } }, size, min, max, collapsible: false };
}

function container(): HTMLElement
{
    const el = document.createElement('main');
    document.body.appendChild(el);
    return el;
}

function pointer(target: EventTarget, type: string, at: number, options: PointerEventInit = {}): void
{
    target.dispatchEvent(new PointerEvent(type, { clientX: at, clientY: at, pointerId: 1, isPrimary: true, button: 0, bubbles: true, ...options }));
}

function basis(el: Element): number
{
    return parseFloat((el.parentElement as HTMLElement).style.flexBasis);
}

/**
 * 兩欄：左邊 a:left（可收合，[100, 400]），右邊 a:main。
 */
function two_columns()
{
    const w = make_world({ a: { left: section('left'), main: section('main') } });
    const layout: basic_ui.layout_node =
    {
        kind: 'group',
        axis: 'x',
        children:
        [
            { ...leaf('a', 'left', 200, 100, 400), collapsible: true, collapsed_size: 20 },
            leaf('a', 'main', 600, 200)
        ]
    };
    const root = basic_ui.mount_ui_root(container(), w, layout);
    const group = root.element.firstElementChild as HTMLElement;
    const separator = group.querySelector('[data-basic_ui_separator]') as HTMLElement;
    const left = root.panels.get('a')!.get('left')!;
    const main = root.panels.get('a')!.get('main')!;
    return { root, group, separator, left, main };
}

describe('basic_ui mount_ui_root container checks', () =>
{
    const w = () => make_world({ a: { p: section('p') } });
    const single: basic_ui.layout_node = { kind: 'panel', panel: { namespace: 'a', id: 'p' } };

    it('requires an attached container', () =>
    {
        expect(() => basic_ui.mount_ui_root(document.createElement('div'), w(), single)).toThrow(/attached/);
    });

    it('is unique per document', () =>
    {
        basic_ui.mount_ui_root(container(), w(), single);
        expect(() => basic_ui.mount_ui_root(container(), w(), single)).toThrow(/already mounted/);
    });
});

describe('basic_ui mount_ui_root render checks', () =>
{
    const layout: basic_ui.layout_node = { kind: 'group', axis: 'x', children: [leaf('a', 'p', 10), leaf('a', 'q', 10)] };

    function mount_with(p: () => HTMLElement, q: () => HTMLElement = section('q')): () => basic_ui.ui_root
    {
        const c = container();
        const w = make_world({ a: { p, q } });
        return () => basic_ui.mount_ui_root(c, w, layout);
    }

    it('rejects non-elements, placed elements and shared elements, leaving the container empty', () =>
    {
        expect(mount_with(() => 'text' as unknown as HTMLElement)).toThrow(/must return an HTMLElement/);
        const placed = document.createElement('div');
        document.body.appendChild(placed);
        expect(mount_with(() => placed)).toThrow(/new element/);
        const shared = document.createElement('div');
        expect(mount_with(() => shared, () => shared)).toThrow(/new element/);
        expect(mount_with(() => { throw new Error('boom'); })).toThrow(/boom/);
        expect(document.querySelector('[data-basic_ui_root]')).toBeNull();
    });

    it('validates the layout before calling any render', () =>
    {
        let calls = 0;
        const c = container();
        const w = make_world({ a: { p: () => { calls++; return document.createElement('div'); } } });
        expect(() => basic_ui.mount_ui_root(c, w, { kind: 'group', axis: 'x', children: [] })).toThrow(/non-empty/);
        expect(calls).toBe(0);
    });
});

describe('basic_ui mount_ui_root structure', () =>
{
    it('builds groups, slots and separators, and indexes panels by pack then name', () =>
    {
        const { root, group, left, main } = two_columns();
        expect(root.element.dataset.basic_ui_root).toBe('');
        expect(group.dataset.basic_ui_group).toBe('x');
        expect([...group.children].map(c => (c as HTMLElement).dataset.basic_ui_separator ?? 'slot')).toEqual(['slot', '0', 'slot']);
        expect(left.content.textContent).toBe('left');
        expect(left.content.dataset.basic_ui_pack).toBe('a');
        expect(left.content.dataset.basic_ui_name).toBe('left');
        expect(left.collapsible).toBe(true);
        expect(main.collapsible).toBe(false);
        expect(basis(left.content)).toBe(200);
        expect(basis(main.content)).toBe(600);
    });

    it('supports a single panel root and nested groups', () =>
    {
        const w = make_world({ a: { top: section('top'), bottom: section('bottom'), side: section('side') } });
        const layout: basic_ui.layout_node =
        {
            kind: 'group',
            axis: 'x',
            children:
            [
                leaf('a', 'side', 100),
                {
                    node: { kind: 'group', axis: 'y', children: [{ ...leaf('a', 'top', 300), collapsible: true, collapsed_size: 0 }, leaf('a', 'bottom', 100)] },
                    size: 500, min: 0, max: Infinity, collapsible: false
                }
            ]
        };
        const root = basic_ui.mount_ui_root(container(), w, layout);
        const top = root.panels.get('a')!.get('top')!;
        const inner = top.content.parentElement!.parentElement as HTMLElement;
        expect(inner.dataset.basic_ui_group).toBe('y');

        fake_observer.resize(inner, 500, 404);
        expect(basis(top.content)).toBe(300);
        top.collapse();
        expect(basis(top.content)).toBe(0);
        expect(basis(root.panels.get('a')!.get('bottom')!.content)).toBe(400);
    });

    it('a root panel cannot collapse', () =>
    {
        const w = make_world({ a: { p: section('p') } });
        const root = basic_ui.mount_ui_root(container(), w, { kind: 'panel', panel: { namespace: 'a', id: 'p' } });
        const p = root.panels.get('a')!.get('p')!;
        expect(p.collapsible).toBe(false);
        expect(() => p.collapse()).toThrow(/not collapsible/);
        expect(p.content.parentElement).toBe(root.element);
    });
});

describe('basic_ui group resize and drag', () =>
{
    it('distributes the container length minus the separator', () =>
    {
        const { group, left, main } = two_columns();
        fake_observer.resize(group, 1604, 300);
        expect(basis(left.content)).toBe(400);
        expect(basis(main.content)).toBe(1200);
    });

    it('drags with pointer capture and stops on pointerup', () =>
    {
        const { group, separator, left, main } = two_columns();
        fake_observer.resize(group, 804, 300);
        pointer(separator, 'pointerdown', 0);
        expect(separator.hasPointerCapture(1)).toBe(true);
        pointer(separator, 'pointermove', 50);
        expect(basis(left.content)).toBe(250);
        expect(basis(main.content)).toBe(550);
        pointer(separator, 'pointermove', 9999);
        expect(basis(left.content)).toBe(400);
        pointer(separator, 'pointerup', 9999);
        expect(separator.hasPointerCapture(1)).toBe(false);
        pointer(separator, 'pointermove', 0);
        expect(basis(left.content)).toBe(400);
    });

    it('ends the drag on pointercancel and lostpointercapture', () =>
    {
        for (const end of ['pointercancel', 'lostpointercapture'])
        {
            document.body.innerHTML = '';
            const { group, separator, left } = two_columns();
            fake_observer.resize(group, 804, 300);
            pointer(separator, 'pointerdown', 0);
            pointer(separator, 'pointermove', 30);
            pointer(separator, end, 30);
            pointer(separator, 'pointermove', 100);
            expect(basis(left.content)).toBe(230);
        }
    });

    it('ignores secondary buttons, non-primary pointers and other pointer ids', () =>
    {
        const { group, separator, left } = two_columns();
        fake_observer.resize(group, 804, 300);
        pointer(separator, 'pointerdown', 0, { button: 2 });
        pointer(separator, 'pointermove', 50);
        expect(basis(left.content)).toBe(200);
        pointer(separator, 'pointerdown', 0, { isPrimary: false });
        pointer(separator, 'pointermove', 50);
        expect(basis(left.content)).toBe(200);

        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 50, { pointerId: 2 });
        expect(basis(left.content)).toBe(200);
        pointer(separator, 'pointerup', 50, { pointerId: 2 });
        pointer(separator, 'pointermove', 10);
        expect(basis(left.content)).toBe(210);
    });

    it('does not jump when the container resizes during a drag', () =>
    {
        const { group, separator, left } = two_columns();
        fake_observer.resize(group, 804, 300);
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 40);
        expect(basis(left.content)).toBe(240);
        // 依比例重排到 900：225 / 675，之後的移動以此為起點
        fake_observer.resize(group, 904, 300);
        expect(basis(left.content)).toBeCloseTo(225);
        pointer(separator, 'pointermove', 50);
        expect(basis(left.content)).toBeCloseTo(235);
        // 只有交叉軸變化：不動
        fake_observer.resize(group, 904, 301);
        expect(basis(left.content)).toBeCloseTo(235);
    });

    it('keeps the proportions through an overflow', () =>
    {
        const { group, left, main } = two_columns();
        fake_observer.resize(group, 804, 300);
        fake_observer.resize(group, 104, 300);
        expect(basis(left.content)).toBe(100);
        expect(basis(main.content)).toBe(200);
        fake_observer.resize(group, 804, 300);
        expect(basis(left.content)).toBe(200);
        expect(basis(main.content)).toBe(600);
    });

    it('a drag during an overflow does not overwrite the proportions', () =>
    {
        const { group, separator, left } = two_columns();
        fake_observer.resize(group, 804, 300);
        fake_observer.resize(group, 104, 300);
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 50);
        pointer(separator, 'pointerup', 50);
        fake_observer.resize(group, 804, 300);
        expect(basis(left.content)).toBe(200);
    });
});

describe('basic_ui collapse', () =>
{
    it('collapses and expands through the handle', () =>
    {
        const { group, left, main } = two_columns();
        fake_observer.resize(group, 804, 300);
        left.collapse();
        expect(left.is_collapsed()).toBe(true);
        expect(basis(left.content)).toBe(20);
        expect(basis(main.content)).toBe(780);
        expect(left.content.parentElement!.dataset.basic_ui_collapsed).toBe('true');
        left.collapse();
        expect(basis(left.content)).toBe(20);

        left.expand();
        expect(left.is_collapsed()).toBe(false);
        expect(basis(left.content)).toBe(200);
        expect(basis(main.content)).toBe(600);
        expect(() => main.collapse()).toThrow(/not collapsible/);
        expect(() => main.expand()).toThrow(/not collapsible/);
    });

    it('a collapsed child stays collapsed through resizes and blocks dragging', () =>
    {
        const { group, separator, left, main } = two_columns();
        fake_observer.resize(group, 804, 300);
        left.collapse();
        fake_observer.resize(group, 1004, 300);
        expect(basis(left.content)).toBe(20);
        expect(basis(main.content)).toBe(980);
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 100);
        pointer(separator, 'pointerup', 100);
        expect(basis(left.content)).toBe(20);
        left.expand();
        expect(basis(left.content)).toBe(200);
    });

    it('collapsing during a drag ends the drag', () =>
    {
        const { group, separator, left } = two_columns();
        fake_observer.resize(group, 804, 300);
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 50);
        left.collapse();
        expect(separator.hasPointerCapture(1)).toBe(false);
        pointer(separator, 'pointermove', 80);
        expect(basis(left.content)).toBe(20);
        left.expand();
        expect(basis(left.content)).toBe(250);
    });
});

describe('basic_ui edge cases', () =>
{
    it('collapsing during an overflow keeps the remembered size and the proportions', () =>
    {
        const { group, left, main } = two_columns();
        fake_observer.resize(group, 804, 300);
        fake_observer.resize(group, 104, 300);
        left.collapse();
        fake_observer.resize(group, 804, 300);
        left.expand();
        expect(basis(left.content)).toBe(200);
        expect(basis(main.content)).toBe(600);
    });

    it('collapsing in a hidden (0 px) container does not wipe the weights', () =>
    {
        const w = make_world({ a: { x: section('x'), y: section('y'), z: section('z') } });
        const layout: basic_ui.layout_node =
        {
            kind: 'group', axis: 'x',
            children: [leaf('a', 'x', 100), { ...leaf('a', 'y', 300), collapsible: true, collapsed_size: 0 }, leaf('a', 'z', 100)]
        };
        const root = basic_ui.mount_ui_root(container(), w, layout);
        const group = root.element.firstElementChild!;
        const [x, y, z] = ['x', 'y', 'z'].map(n => root.panels.get('a')!.get(n)!);
        fake_observer.resize(group, 508, 300);
        fake_observer.resize(group, 0, 0);
        y.collapse();
        fake_observer.resize(group, 508, 300);
        y.expand();
        expect([basis(x.content), basis(y.content), basis(z.content)]).toEqual([100, 300, 100]);
    });

    it('a click without moving does not change the proportions', () =>
    {
        const { group, separator, left, main } = two_columns();
        fake_observer.resize(group, 2004, 300);
        expect(basis(left.content)).toBe(400);
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointerup', 0);
        fake_observer.resize(group, 804, 300);
        expect(basis(left.content)).toBe(200);
        expect(basis(main.content)).toBe(600);
    });

    it('rejects a collapsible group child', () =>
    {
        const w = make_world({ a: { p: section('p') } });
        const layout =
        {
            kind: 'group', axis: 'x',
            children: [{ node: { kind: 'group', axis: 'y', children: [leaf('a', 'p', 10)] }, size: 10, min: 0, max: 100, collapsible: true, collapsed_size: 0 }]
        };
        expect(() => basic_ui.mount_ui_root(container(), w, layout)).toThrow(/only panel children can be collapsible/);
    });
});
