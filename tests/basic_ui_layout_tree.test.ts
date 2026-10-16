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

function leaf(namespace: string, id: string, size = 100): basic_ui.layout_child
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

    it('rejects malformed other_info.basic_ui', () =>
    {
        const list = (other_info: Record<string, unknown>) => () => basic_ui.list_panels(registry({ pack_id: 'x', other_info }));
        expect(list({ basic_ui: 5 })).toThrow(/other_info.basic_ui must be an object/);
        expect(list({ basic_ui: { panels: {}, other: 1 } })).toThrow(/unknown key "other"/);
        expect(list({ basic_ui: {} })).toThrow(/panels must be an object/);
        expect(list({ basic_ui: { panels: { p: 'text' } } })).toThrow(/panel "p" of pack "x" must be an object/);
        expect(list({ basic_ui: { panels: { p: {} } } })).toThrow(/render/);
        expect(list({ basic_ui: { panels: { p: { render, edges: [] } } } })).toThrow(/unknown key "edges"/);
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
                { ...leaf('a', 'left', 200), min: 100, max: 400, collapsible: true, collapsed_size: 20 },
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
        (missing.children as basic_ui.layout_child[]).pop();
        expect(() => basic_ui.check_layout(missing, declarations)).toThrow(/panel "main" of pack "a" is declared but not placed/);

        const twice = full();
        (twice.children as basic_ui.layout_child[]).push(leaf('a', 'left'));
        expect(() => basic_ui.check_layout(twice, declarations)).toThrow(/places panel "left" of pack "a" more than once/);

        const unknown = full();
        (unknown.children as basic_ui.layout_child[]).push(leaf('a', 'nope'));
        expect(() => basic_ui.check_layout(unknown, declarations)).toThrow(/unknown panel "nope" of pack "a"/);
    });

    it('does not confuse namespaces that contain a colon', () =>
    {
        const tricky = basic_ui.list_panels(registry(panels_pack('a:b', ['c']), panels_pack('a', ['b:c'])));
        const layout: basic_ui.layout_node = { kind: 'group', axis: 'x', children: [leaf('a:b', 'c'), leaf('a', 'b:c')] };
        expect(() => basic_ui.check_layout(layout, tricky)).not.toThrow();
    });

    it('rejects bad structure', () =>
    {
        const check = (layout: unknown) => () => basic_ui.check_layout(layout, declarations);
        expect(check(null)).toThrow(/layout must be an object/);
        expect(check({ kind: 'row' })).toThrow(/kind must be/);
        expect(check({ kind: 'group', axis: 'z', children: [] })).toThrow(/axis/);
        expect(check({ kind: 'group', axis: 'x', children: [] })).toThrow(/non-empty array/);
        expect(check({ kind: 'group', axis: 'x', children: [], panel: {} })).toThrow(/unknown key "panel"/);
        expect(check({ kind: 'panel', panel: { namespace: 'a', id: 'left' }, axis: 'x' })).toThrow(/unknown key "axis"/);
        expect(check({ kind: 'panel', panel: { namespace: 'a', id: 1 } })).toThrow(/string namespace and id/);
    });

    it('rejects bad child values', () =>
    {
        const with_child = (patch: Record<string, unknown>) =>
        {
            const layout = full();
            Object.assign(layout.children[0], patch);
            return () => basic_ui.check_layout(layout, declarations);
        };
        expect(with_child({ size: 50 })).toThrow(/outside/);
        expect(with_child({ size: 500 })).toThrow(/outside/);
        expect(with_child({ size: NaN })).toThrow(/outside/);
        expect(with_child({ size: '200' })).toThrow(/numeric/);
        expect(with_child({ min: -1 })).toThrow(/min/);
        expect(with_child({ max: 50 })).toThrow(/max/);
        expect(with_child({ collapsible: 'yes' })).toThrow(/collapsible/);
        expect(with_child({ collapsed_size: undefined })).toThrow(/collapsed_size/);
        expect(with_child({ collapsed_size: 150 })).toThrow(/collapsed_size/);
        expect(with_child({ collapsible: false })).toThrow(/only allowed when collapsible/);
        expect(with_child({ weight: 1 })).toThrow(/unknown key "weight"/);
        expect(with_child({ max: Infinity, size: 300 })).not.toThrow();
    });

    it('only panel children can be collapsible', () =>
    {
        const layout = full();
        Object.assign(layout.children[1], { collapsible: true, collapsed_size: 0 });
        expect(() => basic_ui.check_layout(layout, declarations)).toThrow(/only panel children can be collapsible/);
    });
});
