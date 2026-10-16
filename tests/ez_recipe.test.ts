import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as ez_recipe from '../src/packs/ez_recipe';

const a: core.namespaced_id = { namespace: 'p', id: 'a' };
const b: core.namespaced_id = { namespace: 'p', id: 'b' };
const c: core.namespaced_id = { namespace: 'p', id: 'c' };
const rid: core.namespaced_id = { namespace: 'p', id: 'r' };

describe('ez_recipe ratio', () =>
{
    it('a + 2b = c 乘 3 得 3a + 6b = 3c', () =>
    {
        const rec = ez_recipe.ratio(rid, [{ item_id: a, quantity: 1 }, { item_id: b, quantity: 2 }], [{ item_id: c, quantity: 1 }]);
        expect(ez_recipe.scale_ratio(rec, 3)).toEqual({
            inputs:  [{ item_id: a, quantity: 3 }, { item_id: b, quantity: 6 }],
            outputs: [{ item_id: c, quantity: 3 }]
        });
    });

    it('同一 item 可同時在兩側', () =>
    {
        const rec = ez_recipe.ratio(rid, [{ item_id: a, quantity: 1 }], [{ item_id: a, quantity: 1 }, { item_id: c, quantity: 2 }]);
        expect(ez_recipe.scale_ratio(rec, 0.5).outputs).toEqual([{ item_id: a, quantity: 0.5 }, { item_id: c, quantity: 1 }]);
    });

    it('建立後修改呼叫端的陣列不影響 recipe', () =>
    {
        const inputs: core.item_stack[] = [{ item_id: { ...a }, quantity: 1 }];
        const rec = ez_recipe.ratio(rid, inputs, []);
        inputs[0].quantity = 5;
        inputs[0].item_id.id = 'x';
        expect(rec.inputs).toEqual([{ item_id: a, quantity: 1 }]);
    });

    it('係數非正有限數時報錯', () =>
    {
        for (const q of [0, -1, NaN, Infinity])
        {
            expect(() => ez_recipe.ratio(rid, [{ item_id: a, quantity: q }], [])).toThrow();
            expect(() => ez_recipe.ratio(rid, [], [{ item_id: a, quantity: q }])).toThrow();
        }
    });

    it('同一側 item 重複時報錯', () =>
    {
        expect(() => ez_recipe.ratio(rid, [{ item_id: a, quantity: 1 }, { item_id: { ...a }, quantity: 2 }], [])).toThrow();
    });

    it('t 非 ≥ 0 有限數時報錯', () =>
    {
        const rec = ez_recipe.ratio(rid, [{ item_id: a, quantity: 1 }], [{ item_id: c, quantity: 1 }]);
        for (const t of [-1, NaN, Infinity])
        {
            expect(() => ez_recipe.scale_ratio(rec, t)).toThrow();
        }
        expect(ez_recipe.scale_ratio(rec, 0).outputs).toEqual([{ item_id: c, quantity: 0 }]);
    });

    it('evaluate 未實作，呼叫即報錯', () =>
    {
        const rec = ez_recipe.ratio(rid, [{ item_id: a, quantity: 1 }], [{ item_id: c, quantity: 1 }]);
        expect(() => rec.evaluate(undefined)).toThrow(/not implemented/);
    });
});
