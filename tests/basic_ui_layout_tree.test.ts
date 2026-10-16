import { describe, it, expect } from 'vitest';
import * as core from '@/core';
import * as basic_ui from '@/packs/basic_ui';

function registry(...packs: core.pack_module[]): core.pack_registry
{
    return new Map(packs.map(p => [p.pack_id, p]));
}

const render = () => ({}) as HTMLElement;

function panels_pack(pack_id: string, names: string[]): core.pack_module
{
    return { pack_id, other_info: { basic_ui: { panels: Object.fromEntries(names.map(n => [n, { render }])) } } };
}

function leaf(namespace: string, id: string, size = 100): { node: basic_ui.layout_panel; size: number; min: number; max: number; collapsible: false }
{
    return { node: { kind: 'panel', panel: { namespace, id } }, size, min: 0, max: Infinity, collapsible: false };
}

describe('basic_ui list_panels', () =>
{
    it('reads declarations as pack_id -> name -> declaration, skipping packs without basic_ui', () =>
    {
        const result = basic_ui.list_panels(registry(panels_pack('a', ['left', 'right']), { pack_id: 'plain' }, panels_pack('b', ['log'])));
        expect([...result.keys()]).toEqual(['a', 'b']);
        expect([...result.get('a')!.keys()]).toEqual(['left', 'right']);
        expect(result.get('b')!.get('log')!.render).toBe(render);
    });

    it('requires render to be a function', () =>
    {
        const pack = { pack_id: 'x', other_info: { basic_ui: { panels: { p: {} } } } };
        expect(() => basic_ui.list_panels(registry(pack))).toThrow(/panel "p" of pack "x" must provide render/);
    });
});

describe('basic_ui check_layout', () =>
{
    const declarations = basic_ui.list_panels(registry(panels_pack('a', ['left', 'main']), panels_pack('b', ['log'])));

    function full(): basic_ui.layout_group
    {
        return {
            kind: 'group',
            axis: 'x',
            children:
            [
                { node: { kind: 'panel', panel: { namespace: 'a', id: 'left' } }, size: 200, min: 100, max: 400, collapsible: true, collapsed_size: 20 },
                {
                    node: { kind: 'group', axis: 'y', children: [leaf('a', 'main'), leaf('b', 'log')] },
                    size: 600, min: 0, max: Infinity, collapsible: false
                }
            ]
        };
    }

    it('accepts a valid nested layout and a single panel root', () =>
    {
        expect(() => basic_ui.check_layout(full(), declarations)).not.toThrow();
        const single = basic_ui.list_panels(registry(panels_pack('a', ['only'])));
        expect(() => basic_ui.check_layout({ kind: 'panel', panel: { namespace: 'a', id: 'only' } }, single)).not.toThrow();
    });

    it('requires every declared panel to be placed exactly once', () =>
    {
        const missing = full();
        missing.children.pop();
        expect(() => basic_ui.check_layout(missing, declarations)).toThrow(/panel "main" of pack "a" is declared but not placed/);

        const twice = full();
        twice.children.push(leaf('a', 'left'));
        expect(() => basic_ui.check_layout(twice, declarations)).toThrow(/places panel "left" of pack "a" more than once/);

        const unknown = full();
        unknown.children.push(leaf('a', 'nope'));
        expect(() => basic_ui.check_layout(unknown, declarations)).toThrow(/unknown panel "nope" of pack "a"/);
    });

    it('does not confuse namespaces that contain a colon', () =>
    {
        const tricky = basic_ui.list_panels(registry(panels_pack('a:b', ['c']), panels_pack('a', ['b:c'])));
        expect(() => basic_ui.check_layout({ kind: 'group', axis: 'x', children: [leaf('a:b', 'c'), leaf('a', 'b:c')] }, tricky)).not.toThrow();
    });

    it('rejects an empty group and bad numbers', () =>
    {
        expect(() => basic_ui.check_layout({ kind: 'group', axis: 'x', children: [] }, declarations)).toThrow(/no children/);
        const with_child = (patch: Partial<{ size: number; min: number; max: number; collapsed_size: number }>) =>
        {
            const layout = full();
            Object.assign(layout.children[0], patch);
            return () => basic_ui.check_layout(layout, declarations);
        };
        expect(with_child({ size: 50 })).toThrow(/min ≤ size ≤ max/);
        expect(with_child({ size: 500 })).toThrow(/min ≤ size ≤ max/);
        expect(with_child({ size: NaN })).toThrow(/min ≤ size ≤ max/);
        expect(with_child({ min: -1, collapsed_size: 0 })).toThrow(/min ≤ size ≤ max/);
        expect(with_child({ max: 50 })).toThrow(/min ≤ size ≤ max/);
        expect(with_child({ collapsed_size: 150 })).toThrow(/collapsed_size/);
        expect(with_child({ max: Infinity, size: 300 })).not.toThrow();
    });
});
