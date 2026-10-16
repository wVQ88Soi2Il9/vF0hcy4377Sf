import * as core from '@/core';

/**
 * 有序、無序任意巢狀的 item 組合；葉為 item_stack（係數）。
 * 順序對應什麼（埠、時間等）未決；不做正規化，unordered(b, b) 與 b×2 不同。
 */
export type combination =
    | core.item_stack
    | { kind: 'ordered';   items: combination[] }
    | { kind: 'unordered'; items: combination[] };

export function ordered(...items: combination[]): combination
{
    return { kind: 'ordered', items };
}

export function unordered(...items: combination[]): combination
{
    return { kind: 'unordered', items };
}

/**
 * 葉的係數須為正有限數。
 */
export function check_combination(comb: combination, side: string): void
{
    if ('kind' in comb)
    {
        for (const item of comb.items)
        {
            check_combination(item, side);
        }
        return;
    }
    if (!Number.isFinite(comb.quantity) || comb.quantity <= 0)
    {
        throw new Error(`${side} "${comb.item_id.namespace}:${comb.item_id.id}": coefficient must be a positive finite number, got ${comb.quantity}.`);
    }
}

/**
 * 每個葉乘以 t，結構不變；回傳新物件。
 */
export function scale_combination(comb: combination, t: number): combination
{
    if ('kind' in comb)
    {
        return { kind: comb.kind, items: comb.items.map(item => scale_combination(item, t)) };
    }
    return { item_id: { ...comb.item_id }, quantity: t * comb.quantity };
}
