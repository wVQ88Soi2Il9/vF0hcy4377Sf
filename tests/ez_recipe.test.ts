import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as ez_recipe from '../src/packs/ez_recipe';

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
        const rec = ez_recipe.ratio(rid, ez_recipe.unordered(stack(a, 1), stack(b, 2)), stack(c, 1));
        expect(ez_recipe.scale_ratio(rec, 3)).toEqual({
            inputs:  ez_recipe.unordered(stack(a, 3), stack(b, 6)),
            outputs: stack(c, 3)
        });
    });

    it('有序、無序巢狀組合乘 t 時結構不變', () =>
    {
        const inputs = ez_recipe.ordered(stack(a, 1), ez_recipe.unordered(stack(b, 1), stack(b, 1)), stack(c, 1));
        const rec = ez_recipe.ratio(rid, inputs, ez_recipe.unordered());
        expect(ez_recipe.scale_ratio(rec, 3).inputs).toEqual({
            kind:  'ordered',
            items: [stack(a, 3), { kind: 'unordered', items: [stack(b, 3), stack(b, 3)] }, stack(c, 3)]
        });
    });

    it('同一 item 可同時在兩側', () =>
    {
        const rec = ez_recipe.ratio(rid, stack(a, 1), ez_recipe.unordered(stack(a, 1), stack(c, 2)));
        expect(ez_recipe.scale_ratio(rec, 0.5).outputs).toEqual(ez_recipe.unordered(stack(a, 0.5), stack(c, 1)));
    });

    it('建立後修改呼叫端的組合不影響 recipe', () =>
    {
        const leaf = stack({ ...a }, 1);
        const inputs = ez_recipe.ordered(leaf);
        const rec = ez_recipe.ratio(rid, inputs, ez_recipe.unordered());
        leaf.quantity = 5;
        leaf.item_id.id = 'x';
        expect(rec.inputs).toEqual(ez_recipe.ordered(stack(a, 1)));
    });

    it('巢狀內的係數非正有限數時報錯', () =>
    {
        for (const q of [0, -1, NaN, Infinity])
        {
            const bad = ez_recipe.ordered(stack(a, 1), ez_recipe.unordered(stack(b, q)));
            expect(() => ez_recipe.ratio(rid, bad, ez_recipe.unordered())).toThrow();
            expect(() => ez_recipe.ratio(rid, ez_recipe.unordered(), bad)).toThrow();
        }
    });

    it('t 非 ≥ 0 有限數時報錯', () =>
    {
        const rec = ez_recipe.ratio(rid, stack(a, 1), stack(c, 1));
        for (const t of [-1, NaN, Infinity])
        {
            expect(() => ez_recipe.scale_ratio(rec, t)).toThrow();
        }
        expect(ez_recipe.scale_ratio(rec, 0).outputs).toEqual(stack(c, 0));
    });

    it('evaluate 未實作，呼叫即報錯', () =>
    {
        const rec = ez_recipe.ratio(rid, stack(a, 1), stack(c, 1));
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

    it('可直接用於 ratio', () =>
    {
        const rec = ez_recipe.ratio(rid, ez_recipe.parse_combination('[{p:a, p:b}, p:c]'), ez_recipe.parse_combination('p:c'));
        expect(ez_recipe.scale_ratio(rec, 2).inputs).toEqual(
            ez_recipe.ordered(ez_recipe.unordered(stack(a, 2), stack(b, 2)), stack(c, 2))
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
