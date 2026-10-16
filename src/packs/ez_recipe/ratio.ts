import * as core from '@/core';
import { type combination, check_combination, scale_combination } from './combination';

/**
 * 固定比例的 recipe（1 維線性映射）：t 單位消耗 t·inputs、產出 t·outputs，t ≥ 0。
 * inputs、outputs 為 1 單位的係數，以 combination 表達有序、無序組合；upper_bound 為 t 的上限，可為 Infinity。
 * 以 other_info.ez_recipe.kind = 'ratio' 標記。
 */
export interface ratio_recipe extends core.recipe
{
    inputs:      combination;
    outputs:     combination;
    upper_bound: number;
}

export function ratio(identifier: core.namespaced_id, inputs: combination, outputs: combination, upper_bound: number): ratio_recipe
{
    check_combination(inputs, 'ratio input');
    check_combination(outputs, 'ratio output');
    if (Number.isNaN(upper_bound) || upper_bound < 0)
    {
        throw new Error(`ratio recipe "${identifier.namespace}:${identifier.id}": upper_bound must be >= 0 (Infinity allowed), got ${upper_bound}.`);
    }
    return {
        namespace:   identifier.namespace,
        id:          identifier.id,
        inputs:      scale_combination(inputs, 1),
        outputs:     scale_combination(outputs, 1),
        upper_bound,
        evaluate:    () =>
        {
            throw new Error(`ratio recipe "${identifier.namespace}:${identifier.id}": evaluate is not implemented.`);
        },
        other_info:  { ez_recipe: { kind: 'ratio' } }
    };
}

export function is_ratio_recipe(rec: core.recipe): rec is ratio_recipe
{
    return (rec.other_info?.ez_recipe as { kind?: unknown } | undefined)?.kind === 'ratio';
}

/**
 * t 倍的兩側，結構不變；t 須為 ≥ 0 的有限數。
 */
export function scale_ratio(rec: ratio_recipe, t: number): { inputs: combination; outputs: combination }
{
    if (!Number.isFinite(t) || t < 0)
    {
        throw new Error(`scale_ratio: t must be a non-negative finite number, got ${t}.`);
    }
    return { inputs: scale_combination(rec.inputs, t), outputs: scale_combination(rec.outputs, t) };
}

export type ratio_side = 'inputs' | 'outputs';

function sum_coefficient(comb: combination, item_id: core.namespaced_id): number
{
    if ('kind' in comb)
    {
        return comb.items.reduce((sum, item) => sum + sum_coefficient(item, item_id), 0);
    }
    return comb.item_id.namespace === item_id.namespace && comb.item_id.id === item_id.id ? comb.quantity : 0;
}

/**
 * 由某一側某 item 的目標量反推 t 與兩側；係數取該側所有同 item 葉的總和。
 * 例：a + 2b = c，outputs 的 c 要 3 → t = 3，inputs 為 3a + 6b。
 */
export function solve_ratio(rec: ratio_recipe, side: ratio_side, item_id: core.namespaced_id, quantity: number): { t: number; inputs: combination; outputs: combination }
{
    if (!Number.isFinite(quantity) || quantity < 0)
    {
        throw new Error(`solve_ratio: quantity must be a non-negative finite number, got ${quantity}.`);
    }
    const coefficient = sum_coefficient(rec[side], item_id);
    if (coefficient === 0)
    {
        throw new Error(`solve_ratio: "${item_id.namespace}:${item_id.id}" is not in ${side} of ratio recipe "${rec.namespace}:${rec.id}".`);
    }
    const t = quantity / coefficient;
    return { t, ...scale_ratio(rec, t) };
}
