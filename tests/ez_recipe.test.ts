import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as ez_recipe from '../src/packs/ez_recipe';
import * as test_ui from '../src/packs/test_ui';

const a: core.namespaced_id = { namespace: 'p', id: 'a' };
const b: core.namespaced_id = { namespace: 'p', id: 'b' };
const c: core.namespaced_id = { namespace: 'p', id: 'c' };
const rid: core.namespaced_id = { namespace: 'p', id: 'r' };

function stack(item_id: core.namespaced_id, quantity: number): core.item_stack
{
    return { item_id, quantity };
}

describe('ez_recipe ratio', () =>
{
    it('a + 2b = c 乘 3 得 3a + 6b = 3c', () =>
    {
        const rec = ez_recipe.ratio(rid, ez_recipe.unordered(stack(a, 1), stack(b, 2)), stack(c, 1), Infinity);
        expect(ez_recipe.scale_ratio(rec, 3)).toEqual({
            inputs:  ez_recipe.unordered(stack(a, 3), stack(b, 6)),
            outputs: stack(c, 3)
        });
    });

    it('有序、無序巢狀組合乘 t 時結構不變', () =>
    {
        const inputs = ez_recipe.ordered(stack(a, 1), ez_recipe.unordered(stack(b, 1), stack(b, 1)), stack(c, 1));
        const rec = ez_recipe.ratio(rid, inputs, ez_recipe.unordered(), Infinity);
        expect(ez_recipe.scale_ratio(rec, 3).inputs).toEqual({
            kind:  'ordered',
            items: [stack(a, 3), { kind: 'unordered', items: [stack(b, 3), stack(b, 3)] }, stack(c, 3)]
        });
    });

    it('建立後修改呼叫端的組合不影響 recipe', () =>
    {
        const leaf = stack({ ...a }, 1);
        const inputs = ez_recipe.ordered(leaf);
        const rec = ez_recipe.ratio(rid, inputs, ez_recipe.unordered(), Infinity);
        leaf.quantity = 5;
        leaf.item_id.id = 'x';
        expect(rec.inputs).toEqual(ez_recipe.ordered(stack(a, 1)));
    });

    it('巢狀內的係數非正有限數時報錯', () =>
    {
        for (const q of [0, -1, NaN, Infinity])
        {
            const bad = ez_recipe.ordered(stack(a, 1), ez_recipe.unordered(stack(b, q)));
            expect(() => ez_recipe.ratio(rid, bad, ez_recipe.unordered(), Infinity)).toThrow();
            expect(() => ez_recipe.ratio(rid, ez_recipe.unordered(), bad, Infinity)).toThrow();
        }
    });

    it('t 非 ≥ 0 有限數時報錯', () =>
    {
        const rec = ez_recipe.ratio(rid, stack(a, 1), stack(c, 1), Infinity);
        for (const t of [-1, NaN, Infinity])
        {
            expect(() => ez_recipe.scale_ratio(rec, t)).toThrow();
        }
        expect(ez_recipe.scale_ratio(rec, 0).outputs).toEqual(stack(c, 0));
    });

    it('evaluate 未實作，呼叫即報錯', () =>
    {
        const rec = ez_recipe.ratio(rid, stack(a, 1), stack(c, 1), Infinity);
        expect(() => rec.evaluate(undefined)).toThrow(/not implemented/);
    });
});

describe('ez_recipe parse_combination', () =>
{
    it('[{a, b}, c]：[ ] 為 ordered、{ } 為 unordered', () =>
    {
        expect(ez_recipe.parse_combination('[{p:a, p:b}, p:c]')).toEqual(
            ez_recipe.ordered(ez_recipe.unordered(stack(a, 1), stack(b, 1)), stack(c, 1))
        );
    });

    it('係數寫在 * 前，省略時為 1', () =>
    {
        expect(ez_recipe.parse_combination('{ 2*p:a , 0.5*p:b, p:c }')).toEqual(
            ez_recipe.unordered(stack(a, 2), stack(b, 0.5), stack(c, 1))
        );
    });

    it('單一葉、空節點與深層巢狀', () =>
    {
        expect(ez_recipe.parse_combination('3*p:a')).toEqual(stack(a, 3));
        expect(ez_recipe.parse_combination('[]')).toEqual(ez_recipe.ordered());
        expect(ez_recipe.parse_combination('{[{}, p:a]}')).toEqual(
            ez_recipe.unordered(ez_recipe.ordered(ez_recipe.unordered(), stack(a, 1)))
        );
    });

    it('語法錯誤、缺 namespace、係數不合法時報錯', () =>
    {
        const bad = [
            '', '[p:a', '[p:a,]', '[p:a p:b]', '{p:a]', 'p:a]', '[p:a] p:b', ',',
            'a', ':a', 'p:', '*p:a', 'x*p:a', '2*', '0*p:a', '-1*p:a', 'Infinity*p:a'
        ];
        for (const text of bad)
        {
            expect(() => ez_recipe.parse_combination(text), text).toThrow();
        }
    });
});

describe('ez_recipe solve_ratio', () =>
{
    const rec = ez_recipe.ratio(rid, ez_recipe.parse_combination('{p:a, 2*p:b}'), ez_recipe.parse_combination('p:c'), Infinity);

    it('要 3c：t = 3，需 3a + 6b', () =>
    {
        expect(ez_recipe.solve_ratio(rec, 'outputs', c, 3)).toEqual({
            t:       3,
            inputs:  ez_recipe.unordered(stack(a, 3), stack(b, 6)),
            outputs: stack(c, 3)
        });
    });

    it('由 inputs 反推：有 10b → t = 5，得 5c', () =>
    {
        const r = ez_recipe.solve_ratio(rec, 'inputs', b, 10);
        expect(r.t).toBe(5);
        expect(r.outputs).toEqual(stack(c, 5));
    });

    it('同側重複 item 取係數總和', () =>
    {
        const dup = ez_recipe.ratio(rid, ez_recipe.parse_combination('[{p:a, p:b}, {p:b, p:c}]'), ez_recipe.parse_combination('p:c'), Infinity);
        expect(ez_recipe.solve_ratio(dup, 'inputs', b, 6).t).toBe(3);
    });

    it('同一 item 在兩側時依指定側計算', () =>
    {
        const cat = ez_recipe.ratio(rid, ez_recipe.parse_combination('p:a'), ez_recipe.parse_combination('{2*p:a, p:c}'), Infinity);
        expect(ez_recipe.solve_ratio(cat, 'inputs', a, 4).t).toBe(4);
        expect(ez_recipe.solve_ratio(cat, 'outputs', a, 4).t).toBe(2);
    });

    it('item 不在該側、目標量非 ≥ 0 有限數時報錯', () =>
    {
        expect(() => ez_recipe.solve_ratio(rec, 'inputs', c, 1)).toThrow(/not in inputs/);
        expect(() => ez_recipe.solve_ratio(rec, 'outputs', a, 1)).toThrow(/not in outputs/);
        for (const q of [-1, NaN, Infinity])
        {
            expect(() => ez_recipe.solve_ratio(rec, 'outputs', c, q)).toThrow();
        }
    });
});

describe('ez_recipe ratio upper_bound', () =>
{
    it('upper_bound 須 ≥ 0，可為 Infinity；以 other_info 標記為 ratio', () =>
    {
        for (const ub of [-1, NaN])
        {
            expect(() => ez_recipe.ratio(rid, stack(a, 1), stack(c, 1), ub)).toThrow(/upper_bound/);
        }
        const rec = ez_recipe.ratio(rid, stack(a, 1), stack(c, 1), Infinity);
        expect(rec.upper_bound).toBe(Infinity);
        expect(ez_recipe.is_ratio_recipe(rec)).toBe(true);
        expect(ez_recipe.is_ratio_recipe({ namespace: 'p', id: 'plain', evaluate: () => [] })).toBe(false);
    });
});

describe('ez_recipe evaluate_ratio_graph', () =>
{
    const W: core.vector = [-1, 0];
    const E: core.vector = [1, 0];
    const N: core.vector = [0, -1];
    const S: core.vector = [0, 1];

    function rec(id: string, inputs: string, outputs: string, upper_bound: number): core.recipe
    {
        return ez_recipe.ratio({ namespace: 'p', id }, ez_recipe.parse_combination(inputs), ez_recipe.parse_combination(outputs), upper_bound);
    }

    function make_registry(recipes: core.recipe[]): core.pack_registry
    {
        return new Map([['p', { pack_id: 'p', recipes: Object.fromEntries(recipes.map(r => [r.id, r])) }]]);
    }

    /** ports 依序給方向與 offset；recipe_id 為 undefined 表示未選。 */
    function place(sp: core.space, uid: core.uid, position: core.vector, recipe_id: string | undefined, ports: [core.port_direction, core.vector][]): void
    {
        const device = new test_ui.port_device(uid, { namespace: 'test_ui', id: 'port' }, position);
        device.ports = ports.map(([direction, offset], k) => ({ port_uid: `${k}`, offset, direction }));
        device.selected_recipe_id = recipe_id === undefined ? undefined : { namespace: 'p', id: recipe_id };
        sp.devices.set(uid, device);
    }

    function t_of(result: ez_recipe.ratio_graph_result): Record<string, number>
    {
        return Object.fromEntries([...result.devices].map(([uid, r]) => [uid, r.t]));
    }

    function chain(m2_upper_bound: number): { sp: core.space; registry: core.pack_registry }
    {
        const sp = new core.space([32, 32]);
        place(sp, 'm1', [0, 0], 'r1', [['input', W], ['output', E]]);
        place(sp, 'm2', [2, 0], 'r2', [['input', W], ['output', E]]);
        const registry = make_registry([rec('r1', 'p:ore', 'p:a', Infinity), rec('r2', '2*p:a', 'p:c', m2_upper_bound)]);
        return { sp, registry };
    }

    it('鏈：m2 上限 5 → m2 t = 5、m1 t = 10，外部需 10 ore', () =>
    {
        const { sp, registry } = chain(5);
        const result = ez_recipe.evaluate_ratio_graph(sp, registry);
        expect(t_of(result)).toEqual({ m1: 10, m2: 5 });
        expect(result.devices.get('m2')!.outputs).toEqual(stack(c, 5));
        expect(result.external).toEqual([{ uid: 'm1', item_id: { namespace: 'p', id: 'ore' }, quantity: 10 }]);
    });

    it('全部上限為 Infinity 時結果為 Infinity', () =>
    {
        const { sp, registry } = chain(Infinity);
        const result = ez_recipe.evaluate_ratio_graph(sp, registry);
        expect(t_of(result)).toEqual({ m1: Infinity, m2: Infinity });
        expect(result.external[0].quantity).toBe(Infinity);
    });

    function fork(u_outputs: string): { sp: core.space; registry: core.pack_registry }
    {
        const sp = new core.space([32, 32]);
        place(sp, 'u', [2, 2], 'ru', [['output', E], ['output', S]]);
        place(sp, 'd1', [4, 2], 'rd1', [['input', W]]);
        place(sp, 'd2', [2, 4], 'rd2', [['input', N]]);
        const registry = make_registry([rec('ru', '[]', u_outputs, Infinity), rec('rd1', 'p:c', '[]', 10), rec('rd2', '2*p:d', '[]', 10)]);
        return { sp, registry };
    }

    it('分岔：取最小，u = 10、d1 = 10、d2 = 5，沒有多餘產出', () =>
    {
        const { sp, registry } = fork('[p:c, p:d]');
        expect(t_of(ez_recipe.evaluate_ratio_graph(sp, registry))).toEqual({ u: 10, d1: 10, d2: 5 });
    });

    function diamond(d_inputs: string): { sp: core.space; registry: core.pack_registry }
    {
        const sp = new core.space([32, 32]);
        place(sp, 'u', [0, 2], 'ru', [['output', E], ['output', S]]);
        place(sp, 'a', [2, 2], 'ra', [['input', W], ['output', S]]);
        place(sp, 'b', [0, 4], 'rb', [['input', N], ['output', E]]);
        place(sp, 'd', [2, 4], 'rd', [['input', N], ['input', W]]);
        const registry = make_registry([
            rec('ru', '[]', '[p:a, p:b]', Infinity),
            rec('ra', 'p:a', 'p:x', Infinity),
            rec('rb', 'p:b', 'p:y', Infinity),
            rec('rd', d_inputs, '[]', 10)
        ]);
        return { sp, registry };
    }

    it('菱形比例一致時全部為 10', () =>
    {
        const { sp, registry } = diamond('[p:x, p:y]');
        expect(t_of(ez_recipe.evaluate_ratio_graph(sp, registry))).toEqual({ u: 10, a: 10, b: 10, d: 10 });
    });

    it('菱形比例對不上時該連通部分為 0；其他部分不受影響', () =>
    {
        const { sp, registry } = diamond('[p:x, 2*p:y]');
        place(sp, 'solo', [10, 10], 'rs', [['input', W]]);
        registry.get('p')!.recipes!.rs = rec('rs', 'p:ore', '[]', 3);
        const result = ez_recipe.evaluate_ratio_graph(sp, registry);
        expect(t_of(result)).toEqual({ u: 0, a: 0, b: 0, d: 0, solo: 3 });
        expect(result.external).toEqual([{ uid: 'solo', item_id: { namespace: 'p', id: 'ore' }, quantity: 3 }]);
    });

    it('未選 recipe、不是 ratio、葉數與埠數不符時報錯', () =>
    {
        const sp = new core.space([32, 32]);
        place(sp, 'm', [0, 0], undefined, [['output', E]]);
        expect(() => ez_recipe.evaluate_ratio_graph(sp, make_registry([]))).toThrow(/no selected recipe/);

        place(sp, 'm', [0, 0], 'plain', [['output', E]]);
        expect(() => ez_recipe.evaluate_ratio_graph(sp, make_registry([{ namespace: 'p', id: 'plain', evaluate: () => [] }]))).toThrow(/not a ratio recipe/);

        place(sp, 'm', [0, 0], 'two', [['output', E]]);
        expect(() => ez_recipe.evaluate_ratio_graph(sp, make_registry([rec('two', '[]', '[p:a, p:b]', 1)]))).toThrow(/1 output ports/);
    });

    it('邊兩端 item 不同時報錯', () =>
    {
        const sp = new core.space([32, 32]);
        place(sp, 'm1', [0, 0], 'r1', [['output', E]]);
        place(sp, 'm2', [2, 0], 'r2', [['input', W]]);
        expect(() => ez_recipe.evaluate_ratio_graph(sp, make_registry([rec('r1', '[]', 'p:a', 1), rec('r2', 'p:b', '[]', 1)]))).toThrow(/item mismatch/);
    });

    function pair(u_outputs: string, d_inputs: string): { sp: core.space; registry: core.pack_registry }
    {
        const sp = new core.space([32, 32]);
        place(sp, 'u', [0, 0], 'ru', [['output', [1, 0]], ['output', [1, 2]]]);
        place(sp, 'd', [2, 0], 'rd', [['input', [-1, 0]], ['input', [-1, 2]]]);
        return { sp, registry: make_registry([rec('ru', '[]', u_outputs, 1), rec('rd', d_inputs, '[]', 1)]) };
    }

    it('unordered 對 unordered 無法唯一配對、或同 item 係數不同時報錯', () =>
    {
        const ambiguous_item = pair('{p:c, p:d}', '{p:c, p:d}');
        expect(() => ez_recipe.evaluate_ratio_graph(ambiguous_item.sp, ambiguous_item.registry)).toThrow(/ambiguous/);
        const ambiguous_coefficient = pair('{p:c, 2*p:c}', '{p:c, p:c}');
        expect(() => ez_recipe.evaluate_ratio_graph(ambiguous_coefficient.sp, ambiguous_coefficient.registry)).toThrow(/ambiguous/);
        const resolved = pair('{p:c, p:d}', '[p:d, p:c]');
        expect(t_of(ez_recipe.evaluate_ratio_graph(resolved.sp, resolved.registry))).toEqual({ u: 1, d: 1 });
    });

    it('非平的 unordered 展開時相同子項不重複排列：12 個 [p:x] 加 1 個 [2*p:y] 只有 13 種排列', () =>
    {
        const sp = new core.space([32, 32]);
        place(sp, 'm', [1, 1], 'many', Array.from({ length: 13 }, (_, i) => ['input', [-1, i]] as [core.port_direction, core.vector]));
        const inputs = `{${Array(12).fill('[p:x]').join(', ')}, [2*p:y]}`;
        const result = ez_recipe.evaluate_ratio_graph(sp, make_registry([rec('many', inputs, '[]', 2)]));
        expect(result.external).toEqual([
            { uid: 'm', item_id: { namespace: 'p', id: 'x' }, quantity: 24 },
            { uid: 'm', item_id: { namespace: 'p', id: 'y' }, quantity: 4 }
        ]);
    });

    it('平的 unordered 不展開排列：50 個不同 item，接 49 個後推出剩下的埠', () =>
    {
        const sp = new core.space([64, 64]);
        place(sp, 'm', [2, 1], 'many', Array.from({ length: 50 }, (_, i) => ['input', [-1, i]] as [core.port_direction, core.vector]));
        const recipes = [rec('many', `{${Array.from({ length: 50 }, (_, i) => `p:i${i}`).join(', ')}}`, '[]', 2)];
        for (let k = 0; k < 49; k++)
        {
            place(sp, `u${k}`, [0, 1 + k], `ru${k}`, [['output', E]]);
            recipes.push(rec(`ru${k}`, '[]', `p:i${49 - k}`, Infinity));
        }
        const result = ez_recipe.evaluate_ratio_graph(sp, make_registry(recipes));
        expect(result.devices.get('u0')!.t).toBe(2);
        expect(result.external).toEqual([{ uid: 'm', item_id: { namespace: 'p', id: 'i0' }, quantity: 2 }]);
    });

    it('ordered 裡的平 unordered：[{a, b}, c] 接 b、c 後 a 為外部需求', () =>
    {
        const sp = new core.space([32, 32]);
        place(sp, 'd', [2, 1], 'rd', [['input', [-1, 0]], ['input', [-1, 1]], ['input', [-1, 2]]]);
        place(sp, 'ub', [0, 1], 'rub', [['output', E]]);
        place(sp, 'uc', [0, 3], 'ruc', [['output', E]]);
        const registry = make_registry([rec('rd', '[{p:a, p:b}, p:c]', '[]', 3), rec('rub', '[]', 'p:b', Infinity), rec('ruc', '[]', 'p:c', Infinity)]);
        const result = ez_recipe.evaluate_ratio_graph(sp, registry);
        expect(t_of(result)).toEqual({ d: 3, ub: 3, uc: 3 });
        expect(result.external).toEqual([{ uid: 'd', item_id: { namespace: 'p', id: 'a' }, quantity: 3 }]);
    });

    it('unordered 對 unordered 可由其他邊推出配對', () =>
    {
        const sp = new core.space([32, 32]);
        place(sp, 'u', [0, 1], 'ru', [['output', E], ['output', S]]);
        place(sp, 'd', [2, 1], 'rd', [['input', [-1, 0]], ['input', [-1, 1]]]);
        place(sp, 'e', [0, 3], 're', [['input', N]]);
        const registry = make_registry([rec('ru', '[]', '{p:c, p:d}', Infinity), rec('rd', '{p:c, p:d}', '[]', 4), rec('re', 'p:d', '[]', 4)]);
        const result = ez_recipe.evaluate_ratio_graph(sp, registry);
        expect(t_of(result)).toEqual({ u: 4, d: 4, e: 4 });
        expect(result.external).toEqual([{ uid: 'd', item_id: { namespace: 'p', id: 'd' }, quantity: 4 }]);
    });
});
