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
        expect(list({ basic_ui: 5 })).toThrow(/other_info.basic_ui must be a plain object/);
        expect(list({ basic_ui: [] })).toThrow(/other_info.basic_ui must be a plain object/);
        expect(list({ basic_ui: { panels: {}, other: 1 } })).toThrow(/unknown key "other"/);
        expect(list({ basic_ui: {} })).toThrow(/panels must be a plain object/);
        expect(list({ basic_ui: { panels: null } })).toThrow(/panels must be a plain object/);
        expect(list({ basic_ui: { panels: { p: 'text' } } })).toThrow(/panel "p" of pack "x" must be a plain object/);
        expect(list({ basic_ui: { panels: { p: {} } } })).toThrow(/render/);
        expect(list({ basic_ui: { panels: { p: { render: 1 } } } })).toThrow(/render/);
        expect(list({ basic_ui: { panels: { p: { render, edges: [] } } } })).toThrow(/unknown key "edges"/);
    });
});

describe('basic_ui check_layout', () =>
{
    const declarations = basic_ui.list_panels(registry(panels_pack('a', ['left', 'main']), panels_pack('b', ['log'])));

    function full(): basic_ui.layout_node
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
        const layout = full();
        const checked = basic_ui.check_layout(layout, declarations);
        expect(checked).toEqual(layout);
        expect(checked).not.toBe(layout);
        const single = basic_ui.list_panels(registry(panels_pack('a', ['only'])));
        expect(() => basic_ui.check_layout({ kind: 'panel', panel: { namespace: 'a', id: 'only' } }, single)).not.toThrow();
    });

    it('requires every declared panel to be placed exactly once', () =>
    {
        const missing = full() as basic_ui.layout_group;
        missing.children.pop();
        expect(() => basic_ui.check_layout(missing, declarations)).toThrow(/panel "main" of pack "a" is declared but not placed/);

        const twice = full() as basic_ui.layout_group;
        twice.children.push(leaf('a', 'left'));
        expect(() => basic_ui.check_layout(twice, declarations)).toThrow(/places panel "left" of pack "a" more than once/);

        const unknown = full() as basic_ui.layout_group;
        unknown.children.push(leaf('a', 'nope'));
        expect(() => basic_ui.check_layout(unknown, declarations)).toThrow(/unknown panel "nope" of pack "a"/);
        unknown.children[2] = leaf('zzz', 'left');
        expect(() => basic_ui.check_layout(unknown, declarations)).toThrow(/unknown panel "left" of pack "zzz"/);
    });

    it('does not confuse namespaces that contain a colon', () =>
    {
        const tricky = basic_ui.list_panels(registry(panels_pack('a:b', ['c']), panels_pack('a', ['b:c'])));
        const layout: basic_ui.layout_node = { kind: 'group', axis: 'x', children: [leaf('a:b', 'c'), leaf('a', 'b:c')] };
        expect(() => basic_ui.check_layout(layout, tricky)).not.toThrow();
    });

    it('rejects reused node objects and cycles', () =>
    {
        const group: basic_ui.layout_group = { kind: 'group', axis: 'x', children: [] };
        group.children.push({ node: group, size: 1, min: 0, max: 1, collapsible: false });
        expect(() => basic_ui.check_layout(group, declarations)).toThrow(/reuses a node/);

        const shared = { kind: 'group', axis: 'y', children: [leaf('a', 'main'), leaf('b', 'log')] } as basic_ui.layout_group;
        const layout: basic_ui.layout_node =
        {
            kind: 'group', axis: 'x',
            children: [leaf('a', 'left'), { node: shared, size: 1, min: 0, max: 1, collapsible: false }, { node: shared, size: 1, min: 0, max: 1, collapsible: false }]
        };
        expect(() => basic_ui.check_layout(layout, declarations)).toThrow(/reuses a node/);
    });

    it('rejects bad structure', () =>
    {
        const check = (layout: unknown) => () => basic_ui.check_layout(layout, declarations);
        expect(check(null)).toThrow(/layout must be a plain object/);
        expect(check({ kind: 'row' })).toThrow(/kind must be/);
        expect(check({ kind: 'group', axis: 'z', children: [] })).toThrow(/axis/);
        expect(check({ kind: 'group', axis: 'x', children: [] })).toThrow(/non-empty array/);
        expect(check({ kind: 'group', axis: 'x', children: {} })).toThrow(/must be an array/);
        expect(check({ kind: 'group', axis: 'x', children: [], panel: {} })).toThrow(/unknown key "panel"/);
        expect(check({ kind: 'panel', panel: { namespace: 'a', id: 'left' }, axis: 'x' })).toThrow(/unknown key "axis"/);
        expect(check({ kind: 'panel', panel: { namespace: 'a', id: 1 } })).toThrow(/string namespace and id/);
        expect(check({ kind: 'panel', panel: { namespace: 'a', id: 'left', x: 1 } })).toThrow(/unknown key "x"/);
    });

    it('rejects bad child values', () =>
    {
        const with_child = (patch: Record<string, unknown>) =>
        {
            const layout = full() as basic_ui.layout_group;
            Object.assign(layout.children[0], patch);
            return () => basic_ui.check_layout(layout, declarations);
        };
        expect(with_child({ size: 50 })).toThrow(/outside/);
        expect(with_child({ size: 500 })).toThrow(/outside/);
        expect(with_child({ size: NaN })).toThrow(/outside/);
        expect(with_child({ size: '200' })).toThrow(/numeric/);
        expect(with_child({ min: -1 })).toThrow(/min/);
        expect(with_child({ max: 50 })).toThrow(/max/);
        expect(with_child({ max: NaN })).toThrow(/max/);
        expect(with_child({ collapsible: 'yes' })).toThrow(/collapsible/);
        expect(with_child({ collapsed_size: undefined })).toThrow(/collapsed_size/);
        expect(with_child({ collapsed_size: 150 })).toThrow(/collapsed_size/);
        expect(with_child({ collapsed_size: -1 })).toThrow(/collapsed_size/);
        expect(with_child({ collapsible: false })).toThrow(/only allowed when collapsible/);
        expect(with_child({ weight: 1 })).toThrow(/unknown key "weight"/);
        expect(with_child({ max: Infinity, size: 300 })).not.toThrow();
    });
});

describe('basic_ui validation of untrusted objects', () =>
{
    const list = (other_info: object) => () => basic_ui.list_panels(registry({ pack_id: 'x', other_info: other_info as Record<string, unknown> }));

    it('rejects non-plain and inherited panel declarations', () =>
    {
        expect(list({ basic_ui: { panels: new Map([['p', { render }]]) } })).toThrow(/panels must be a plain object/);
        expect(list({ basic_ui: { panels: Object.create({ p: { render } }) } })).toThrow(/panels must be a plain object/);
        expect(list({ basic_ui: Object.create({ panels: {} }) })).toThrow(/basic_ui must be a plain object/);
        expect(list(Object.create({ basic_ui: { panels: {} } }))).toThrow(/own data property/);
        const proto_literal = JSON.parse('{"basic_ui":{"panels":{"__proto__":{"render":1}}}}');
        expect(list(proto_literal)).toThrow(/render/);
    });

    it('rejects getters, symbol keys and non-enumerable keys', () =>
    {
        const getter = { get render() { return render; } };
        expect(list({ basic_ui: { panels: { p: getter } } })).toThrow(/plain enumerable data property/);
        expect(list({ basic_ui: { panels: { p: { render, [Symbol('s')]: 1 } } } })).toThrow(/symbol keys/);
        const hidden = { render };
        Object.defineProperty(hidden, 'extra', { value: 1, enumerable: false });
        expect(list({ basic_ui: { panels: { p: hidden } } })).toThrow(/extra/);
    });

    it('accepts an empty panels object and prototype-like names', () =>
    {
        expect(basic_ui.list_panels(registry(panels_pack('x', []))).get('x')!.size).toBe(0);
        const names = ['constructor', 'toString', 'hasOwnProperty'];
        const declarations = basic_ui.list_panels(registry(panels_pack('constructor', names)));
        expect([...declarations.get('constructor')!.keys()]).toEqual(names);
        const layout: basic_ui.layout_node = { kind: 'group', axis: 'x', children: names.map(n => leaf('constructor', n)) };
        expect(() => basic_ui.check_layout(layout, declarations)).not.toThrow();
        const missing: basic_ui.layout_node = { kind: 'group', axis: 'x', children: [leaf('toString', 'constructor')] };
        expect(() => basic_ui.check_layout(missing, declarations)).toThrow(/unknown panel/);
    });

    const one = basic_ui.list_panels(registry(panels_pack('a', ['p'])));

    it('rejects sparse children', () =>
    {
        // eslint-disable-next-line no-sparse-arrays
        const layout = { kind: 'group', axis: 'x', children: [, leaf('a', 'p')] };
        expect(() => basic_ui.check_layout(layout, one)).toThrow(/children\[0\] is missing/);
    });

    it('rejects getters and inherited fields in the layout', () =>
    {
        let reads = 0;
        const child = { node: { kind: 'panel', panel: { namespace: 'a', id: 'p' } }, min: 0, max: 10, collapsible: false, get size() { return reads++ < 4 ? 1 : -5; } };
        expect(() => basic_ui.check_layout({ kind: 'group', axis: 'x', children: [child] }, one)).toThrow(/plain enumerable data property/);
        const inherited = Object.create(leaf('a', 'p'));
        expect(() => basic_ui.check_layout({ kind: 'group', axis: 'x', children: [inherited] }, one)).toThrow(/plain object/);
        const node = Object.create({ kind: 'panel', panel: { namespace: 'a', id: 'p' } });
        expect(() => basic_ui.check_layout(node, one)).toThrow(/plain object/);
    });

    it('reports a bad collapsed_size without crashing on its type', () =>
    {
        const bad = (collapsed_size: unknown) => () => basic_ui.check_layout(
            { kind: 'group', axis: 'x', children: [{ ...leaf('a', 'p'), collapsible: true, collapsed_size }] }, one);
        expect(bad(Symbol('s'))).toThrow(/collapsed_size must be a number/);
        expect(bad(Object.create(null))).toThrow(/collapsed_size must be a number/);
        expect(bad(undefined)).toThrow(/collapsed_size must be a number/);
        const not_collapsible = { kind: 'group', axis: 'x', children: [{ ...leaf('a', 'p'), collapsed_size: undefined }] };
        expect(() => basic_ui.check_layout(not_collapsible, one)).toThrow(/only allowed when collapsible/);
    });

    it('returns a frozen copy that later mutation does not affect', () =>
    {
        const input = { kind: 'group', axis: 'x', children: [{ ...leaf('a', 'p', 5), max: 10 }] } as { kind: 'group'; axis: 'x'; children: { size: number }[] };
        const checked = basic_ui.check_layout(input, one) as basic_ui.layout_group;
        input.children[0].size = -5;
        expect(checked.children[0].size).toBe(5);
        expect(Object.isFrozen(checked)).toBe(true);
        expect(Object.isFrozen(checked.children)).toBe(true);
        expect(Object.isFrozen(checked.children[0])).toBe(true);
    });
});

describe('basic_ui validation, second review', () =>
{
    const one = basic_ui.list_panels(registry(panels_pack('a', ['p'])));

    it('rejects a non-object other_info', () =>
    {
        for (const other_info of [null, 'str', 5])
        {
            expect(() => basic_ui.list_panels(registry({ pack_id: 'a', other_info } as unknown as core.pack_module))).toThrow(/other_info must be an object/);
        }
    });

    it('rejects getters and extra keys on children arrays', () =>
    {
        const with_getter: unknown[] = [leaf('a', 'p')];
        Object.defineProperty(with_getter, 1, { get: () => leaf('a', 'p'), enumerable: true });
        expect(() => basic_ui.check_layout({ kind: 'group', axis: 'x', children: with_getter }, one)).toThrow(/children\[1\] must be a plain/);
        const with_extra = Object.assign([leaf('a', 'p')], { weight: 1 });
        expect(() => basic_ui.check_layout({ kind: 'group', axis: 'x', children: with_extra }, one)).toThrow(/unknown key "weight"/);
    });
});
