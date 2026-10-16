import * as core from '@/core';
import { type combination, check_combination, scale_combination } from './combination';

/**
 * 固定比例的 recipe（1 維線性映射）：t 單位消耗 t·inputs、產出 t·outputs，t ≥ 0。
 * inputs、outputs 為 1 單位的係數，以 combination 表達有序、無序組合。
 */
export interface ratio_recipe extends core.recipe
{
    inputs:  combination;
    outputs: combination;
}

export function ratio(identifier: core.namespaced_id, inputs: combination, outputs: combination): ratio_recipe
{
    check_combination(inputs, 'ratio input');
    check_combination(outputs, 'ratio output');
    return {
        namespace: identifier.namespace,
        id:        identifier.id,
        inputs:    scale_combination(inputs, 1),
        outputs:   scale_combination(outputs, 1),
        evaluate:  () =>
        {
            throw new Error(`ratio recipe "${identifier.namespace}:${identifier.id}": evaluate is not implemented.`);
        }
    };
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
