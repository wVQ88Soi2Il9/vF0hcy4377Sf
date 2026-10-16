import * as core from '@/core';

/**
 * 固定比例的 recipe（1 維線性映射）：t 單位消耗 t·inputs、產出 t·outputs，t ≥ 0。
 * inputs、outputs 為 1 單位的係數，是以 item id 為基底的向量：順序無關，同一側 item 不重複。
 */
export interface ratio_recipe extends core.recipe
{
    inputs:  core.item_stack[];
    outputs: core.item_stack[];
}

function item_key(item_id: core.namespaced_id): string
{
    return `${item_id.namespace}:${item_id.id}`;
}

function check_side(stacks: core.item_stack[], side: string): void
{
    const seen = new Set<string>();
    for (const stack of stacks)
    {
        const key = item_key(stack.item_id);
        if (!Number.isFinite(stack.quantity) || stack.quantity <= 0)
        {
            throw new Error(`ratio ${side} "${key}": coefficient must be a positive finite number, got ${stack.quantity}.`);
        }
        if (seen.has(key))
        {
            throw new Error(`ratio ${side} "${key}": duplicate item.`);
        }
        seen.add(key);
    }
}

function scale_stacks(stacks: core.item_stack[], t: number): core.item_stack[]
{
    return stacks.map(s => ({ item_id: { ...s.item_id }, quantity: t * s.quantity }));
}

export function ratio(identifier: core.namespaced_id, inputs: core.item_stack[], outputs: core.item_stack[]): ratio_recipe
{
    check_side(inputs, 'input');
    check_side(outputs, 'output');
    return {
        namespace: identifier.namespace,
        id:        identifier.id,
        inputs:    scale_stacks(inputs, 1),
        outputs:   scale_stacks(outputs, 1),
        evaluate:  () =>
        {
            throw new Error(`ratio recipe "${item_key(identifier)}": evaluate is not implemented.`);
        }
    };
}

/**
 * t 倍的兩側；t 須為 ≥ 0 的有限數。
 */
export function scale_ratio(rec: ratio_recipe, t: number): { inputs: core.item_stack[]; outputs: core.item_stack[] }
{
    if (!Number.isFinite(t) || t < 0)
    {
        throw new Error(`scale_ratio: t must be a non-negative finite number, got ${t}.`);
    }
    return { inputs: scale_stacks(rec.inputs, t), outputs: scale_stacks(rec.outputs, t) };
}
