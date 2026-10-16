// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import * as core from '@/core';
import * as world from '@/world';
import * as panel from '@/packs/panel';

beforeEach(() =>
{
    document.body.innerHTML = '';
});

function make_world(panels: Record<string, Record<string, () => HTMLElement>>): world.pure_world
{
    const manifests: core.pack_manifest[] = Object.entries(panels).map(([pack_id, by_name]) => ({
        pack_id,
        provides: { other_info: { panel: { panels: Object.fromEntries(Object.entries(by_name).map(([n, render]) => [n, { render }])) } } }
    }));
    return new world.pure_world(world.compose([panel.manifest, ...manifests]), new core.space([4, 4]));
}

const section = (text: string) => () =>
{
    const el = document.createElement('section');
    el.textContent = text;
    return el;
};

function leaf(namespace: string, id: string, size: number, min = 0, max = Infinity): { node: panel.layout_panel; size: number; min: number; max: number; collapsible: false }
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

function slot_of(content: HTMLElement): HTMLElement
{
    return content.parentElement as HTMLElement;
}

function grow(content: HTMLElement): number
{
    return parseFloat(slot_of(content).style.flexGrow);
}

// happy-dom 沒有版面計算：拖曳開始時量到的 px 以 stub 提供
function stub_width(content: HTMLElement, width: number): void
{
    slot_of(content).getBoundingClientRect = () => ({ width, height: width } as DOMRect);
}

/**
 * 兩欄：左邊 a:left（可收合，[100, 400]），右邊 a:main（[200, ∞)）。
 */
function two_columns()
{
    const w = make_world({ a: { left: section('left'), main: section('main') } });
    const layout: panel.layout_node =
    {
        kind: 'group',
        axis: 'x',
        children:
        [
            { ...leaf('a', 'left', 200, 100, 400), collapsible: true, collapsed_size: 20 },
            leaf('a', 'main', 600, 200)
        ]
    };
    const root = panel.mount_ui_root(container(), w, layout);
    const group = root.element.firstElementChild as HTMLElement;
    const separator = group.querySelector('[data-panel_separator]') as HTMLElement;
    const left = root.panels.get('a')!.get('left')!;
    const main = root.panels.get('a')!.get('main')!;
    stub_width(left.content, 200);
    stub_width(main.content, 600);
    return { root, group, separator, left, main };
}

describe('panel mount_ui_root checks', () =>
{
    const w = () => make_world({ a: { p: section('p') } });
    const single: panel.layout_node = { kind: 'panel', panel: { namespace: 'a', id: 'p' } };

    it('requires an attached container and is unique per document', () =>
    {
        expect(() => panel.mount_ui_root(document.createElement('div'), w(), single)).toThrow(/attached/);
        panel.mount_ui_root(container(), w(), single);
        expect(() => panel.mount_ui_root(container(), w(), single)).toThrow(/already mounted/);
    });

    it('rejects bad render results and validates the layout first, leaving the container empty', () =>
    {
        const layout: panel.layout_node = { kind: 'group', axis: 'x', children: [leaf('a', 'p', 10), leaf('a', 'q', 10)] };
        const mount = (p: () => HTMLElement, q: () => HTMLElement = section('q')) => () =>
            panel.mount_ui_root(container(), make_world({ a: { p, q } }), layout);
        const placed = document.createElement('div');
        document.body.appendChild(placed);
        expect(mount(() => placed)).toThrow(/new element/);
        const shared = document.createElement('div');
        expect(mount(() => shared, () => shared)).toThrow(/new element/);
        expect(document.querySelector('[data-panel_root]')).toBeNull();

        let calls = 0;
        const counting = make_world({ a: { p: () => { calls++; return document.createElement('div'); } } });
        expect(() => panel.mount_ui_root(container(), counting, { kind: 'group', axis: 'x', children: [] })).toThrow(/no children/);
        expect(calls).toBe(0);
    });
});

describe('panel structure', () =>
{
    it('builds groups, slots and separators with flex weights and limits', () =>
    {
        const { root, group, left, main } = two_columns();
        expect(root.element.dataset.panel_root).toBe('');
        expect(group.dataset.panel_group).toBe('x');
        expect([...group.children].map(c => (c as HTMLElement).dataset.panel_separator ?? 'slot')).toEqual(['slot', '0', 'slot']);
        expect(left.content.dataset.panel_pack).toBe('a');
        expect(left.content.dataset.panel_name).toBe('left');
        expect(grow(left.content)).toBe(200);
        expect(grow(main.content)).toBe(600);
        expect(slot_of(left.content).style.minWidth).toBe('100px');
        expect(slot_of(left.content).style.maxWidth).toBe('400px');
        expect(slot_of(main.content).style.maxWidth).toBe('none');
    });

    it('uses height limits in a y group and supports a single panel root', () =>
    {
        const w = make_world({ a: { top: section('top'), bottom: section('bottom') } });
        const root = panel.mount_ui_root(container(), w, { kind: 'group', axis: 'y', children: [leaf('a', 'top', 300, 50, 500), leaf('a', 'bottom', 100)] });
        const top = root.panels.get('a')!.get('top')!;
        expect(slot_of(top.content).style.minHeight).toBe('50px');
        expect(slot_of(top.content).style.maxHeight).toBe('500px');

        document.body.innerHTML = '';
        const single = panel.mount_ui_root(container(), make_world({ a: { p: section('p') } }), { kind: 'panel', panel: { namespace: 'a', id: 'p' } });
        const p = single.panels.get('a')!.get('p')!;
        expect(p.collapsible).toBe(false);
        expect(() => p.collapse()).toThrow(/not collapsible/);
        expect(p.content.parentElement).toBe(single.element);
    });
});

describe('panel drag', () =>
{
    it('sets the weights to the new px', () =>
    {
        const { separator, left, main } = two_columns();
        pointer(separator, 'pointerdown', 0);
        expect(separator.hasPointerCapture(1)).toBe(true);
        pointer(separator, 'pointermove', 100);
        expect(grow(left.content)).toBeCloseTo(300);
        expect(grow(main.content)).toBeCloseTo(500);
        pointer(separator, 'pointermove', 9999);
        expect(grow(left.content)).toBeCloseTo(400);
        pointer(separator, 'pointerup', 9999);
        expect(separator.hasPointerCapture(1)).toBe(false);
        pointer(separator, 'pointermove', 0);
        expect(grow(left.content)).toBeCloseTo(400);
    });

    it('ends on pointercancel and lostpointercapture', () =>
    {
        for (const end of ['pointercancel', 'lostpointercapture'])
        {
            document.body.innerHTML = '';
            const { separator, left } = two_columns();
            pointer(separator, 'pointerdown', 0);
            pointer(separator, 'pointermove', 30);
            pointer(separator, end, 30);
            pointer(separator, 'pointermove', 100);
            expect(grow(left.content)).toBeCloseTo(230);
        }
    });

    it('ignores secondary buttons, non-primary pointers and other pointer ids', () =>
    {
        const { separator, left } = two_columns();
        pointer(separator, 'pointerdown', 0, { button: 2 });
        pointer(separator, 'pointermove', 50);
        pointer(separator, 'pointerdown', 0, { isPrimary: false });
        pointer(separator, 'pointermove', 50);
        expect(grow(left.content)).toBe(200);

        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 50, { pointerId: 2 });
        expect(grow(left.content)).toBe(200);
        pointer(separator, 'pointermove', 10);
        expect(grow(left.content)).toBeCloseTo(210);
    });

    it('does not move other panels when a neighbour is held at its min', () =>
    {
        const w = make_world({ a: { p: section('p'), q: section('q'), r: section('r') } });
        const layout: panel.layout_node = { kind: 'group', axis: 'x', children: [leaf('a', 'p', 300, 300), leaf('a', 'q', 300), leaf('a', 'r', 300)] };
        const root = panel.mount_ui_root(container(), w, layout);
        const [p, q, r] = ['p', 'q', 'r'].map(n => root.panels.get('a')!.get(n)!.content);
        // 容器 608：p 卡在 min 300，q / r 各 150
        stub_width(p, 300);
        stub_width(q, 150);
        stub_width(r, 150);
        const separator = root.element.querySelector('[data-panel_separator="0"]')!;
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 0);
        expect([grow(p), grow(q), grow(r)]).toEqual([300, 300, 300]);
        pointer(separator, 'pointermove', 50);
        // 與 350 / 100 / 150 px 成比例，總和維持 900
        expect(grow(p)).toBeCloseTo(525);
        expect(grow(q)).toBeCloseTo(150);
        expect(grow(r)).toBeCloseTo(225);
    });

    it('a collapsed sibling keeps its share after a drag elsewhere', () =>
    {
        const w = make_world({ a: { p: section('p'), q: section('q'), r: section('r') } });
        const layout: panel.layout_node =
        {
            kind: 'group', axis: 'x',
            children: [leaf('a', 'p', 200), leaf('a', 'q', 200), { ...leaf('a', 'r', 200), collapsible: true, collapsed_size: 0 }]
        };
        const root = panel.mount_ui_root(container(), w, layout);
        const [p, q, r] = ['p', 'q', 'r'].map(n => root.panels.get('a')!.get(n)!);
        r.collapse();
        // 容器 1208：p / q 各 600
        stub_width(p.content, 600);
        stub_width(q.content, 600);
        stub_width(r.content, 0);
        const separator = root.element.querySelector('[data-panel_separator="0"]')!;
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 60);
        pointer(separator, 'pointerup', 60);
        r.expand();
        // p : q = 660 : 540，總和 400 不變；r 的 200 仍是三分之一
        expect(grow(p.content)).toBeCloseTo(220);
        expect(grow(q.content)).toBeCloseTo(180);
        expect(grow(r.content)).toBe(200);
    });

    it('keeps the proportions when pressed during an overflow', () =>
    {
        const { separator, left, main } = two_columns();
        stub_width(left.content, 100);
        stub_width(main.content, 200);
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 30);
        pointer(separator, 'pointerup', 30);
        expect([grow(left.content), grow(main.content)]).toEqual([200, 600]);
    });

    it('clamps measured sizes that are slightly outside the limits', () =>
    {
        const { separator, left } = two_columns();
        stub_width(left.content, 99.9999);
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', -50);
        expect(grow(left.content)).toBeGreaterThan(0);
    });
});

describe('panel collapse', () =>
{
    it('pins the slot at collapsed_size and restores the weight on expand', () =>
    {
        const { left, main } = two_columns();
        left.collapse();
        expect(left.is_collapsed()).toBe(true);
        expect(slot_of(left.content).style.flexGrow).toBe('0');
        expect(slot_of(left.content).style.flexBasis).toBe('20px');
        expect(slot_of(left.content).dataset.panel_collapsed).toBe('true');
        expect(grow(main.content)).toBe(600);

        left.expand();
        expect(left.is_collapsed()).toBe(false);
        expect(grow(left.content)).toBe(200);
        expect(slot_of(left.content).style.minWidth).toBe('100px');
        expect(() => main.collapse()).toThrow(/not collapsible/);
    });

    it('a collapsed neighbour blocks dragging, and collapsing ends a drag', () =>
    {
        const { separator, left, main } = two_columns();
        left.collapse();
        stub_width(left.content, 20);
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 100);
        pointer(separator, 'pointerup', 100);
        expect(grow(main.content)).toBe(600);
        left.expand();

        stub_width(left.content, 200);
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 50);
        left.collapse();
        expect(separator.hasPointerCapture(1)).toBe(false);
        left.expand();
        expect(grow(left.content)).toBeCloseTo(250);
    });
});

describe('panel CSS lengths, ARIA and separator state', () =>
{
    // 無效 CSS 長度的報錯依賴瀏覽器拒絕該值；happy-dom 會接受任何字串，所以只在真實瀏覽器驗證
    it('writes CSS lengths as given', () =>
    {
        const w = make_world({ a: { p: section('p'), q: section('q') } });
        const layout: panel.layout_node =
        {
            kind: 'group', axis: 'x',
            children: [{ ...leaf('a', 'p', 1), min: '10vw', max: 'max(25vw, 450px)' }, leaf('a', 'q', 1)]
        };
        const root = panel.mount_ui_root(container(), w, layout);
        const p = slot_of(root.panels.get('a')!.get('p')!.content);
        expect(p.style.minWidth).toBe('10vw');
        expect(p.style.maxWidth).toContain('max(');
    });

    it('resolves percentage limits against the group length when dragging', () =>
    {
        const w = make_world({ a: { p: section('p'), q: section('q') } });
        const layout: panel.layout_node =
        {
            kind: 'group', axis: 'x',
            children: [{ ...leaf('a', 'p', 400), max: '60%' }, leaf('a', 'q', 400)]
        };
        const root = panel.mount_ui_root(container(), w, layout);
        const group = root.element.firstElementChild as HTMLElement;
        group.getBoundingClientRect = () => ({ width: 804, height: 100 } as DOMRect);
        const [p, q] = ['p', 'q'].map(n => root.panels.get('a')!.get(n)!.content);
        stub_width(p, 400);
        stub_width(q, 400);
        const separator = group.querySelector('[data-panel_separator]')!;
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', 9999);
        // 60% of 804 = 482.4
        expect(grow(p) / (grow(p) + grow(q)) * 800).toBeCloseTo(482.4);
    });

    it('marks separators with ARIA, flags dragging and hides them next to collapsed panels', () =>
    {
        const { separator, left } = two_columns();
        expect(separator.getAttribute('role')).toBe('separator');
        expect(separator.getAttribute('aria-orientation')).toBe('vertical');

        pointer(separator, 'pointerdown', 0);
        expect(separator.dataset.panel_dragging).toBe('');
        pointer(separator, 'pointerup', 0);
        expect(separator.dataset.panel_dragging).toBeUndefined();

        left.collapse();
        expect(separator.hidden).toBe(true);
        left.expand();
        expect(separator.hidden).toBe(false);
    });
});

describe('panel CSS length review fixes', () =>
{
    const mount_with = (child: Partial<panel.layout_child>) =>
    {
        const layout = { kind: 'group', axis: 'x', children: [{ ...leaf('a', 'p', 100), ...child }, leaf('a', 'q', 100)] } as panel.layout_node;
        return () => panel.mount_ui_root(container(), make_world({ a: { p: section('p'), q: section('q') } }), layout);
    };

    it('rejects percentages mixed into expressions at mount', () =>
    {
        expect(mount_with({ max: 'calc(100% - 300px)' })).toThrow(/mixes a percentage/);
        expect(mount_with({ collapsible: true, collapsed_size: 'max(30%, 20px)' } as Partial<panel.layout_child>)).toThrow(/mixes a percentage/);
        expect(mount_with({ max: '60%' })).not.toThrow();
    });

    it('checks each numeric side of size and rejects an infinite collapsed_size', () =>
    {
        expect(mount_with({ min: 120, max: '40vw', size: 50 })).toThrow(/min ≤ size ≤ max/);
        expect(mount_with({ min: '10vw', max: 80, size: 100 })).toThrow(/min ≤ size ≤ max/);
        expect(mount_with({ min: '10vw', collapsible: true, collapsed_size: Infinity } as Partial<panel.layout_child>)).toThrow(/collapsed_size/);
    });

    it('lets min win over max when dragging, like CSS', () =>
    {
        const w = make_world({ a: { p: section('p'), q: section('q') } });
        const layout: panel.layout_node = { kind: 'group', axis: 'x', children: [{ ...leaf('a', 'p', 300), min: 300, max: '200px' }, leaf('a', 'q', 300)] };
        const root = panel.mount_ui_root(container(), w, layout);
        const [p, q] = ['p', 'q'].map(n => root.panels.get('a')!.get(n)!.content);
        stub_width(p, 300);
        stub_width(q, 300);
        const separator = root.element.querySelector('[data-panel_separator]')!;
        pointer(separator, 'pointerdown', 0);
        pointer(separator, 'pointermove', -50);
        pointer(separator, 'pointermove', 50);
        // p 固定在 300：拖不動
        expect(grow(p)).toBe(300);
        expect(grow(q)).toBe(300);
    });
});
