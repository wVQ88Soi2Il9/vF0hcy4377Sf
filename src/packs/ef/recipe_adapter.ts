/**
 * EF Recipe -> Core Recipe Adapter
 *
 * 將 EF 產品配方轉換為相容核心引擎 evaluate 契約之動態配方物件。
 */

import type { recipe, recipe_evaluation } from '@/core';
import type { recipe_def } from './types';
import { product_list } from './data/products';

/**
 * 將單一 EF recipe_def 轉換為核心 recipe 物件。
 */
export function recipe_def_to_recipe(def: recipe_def): recipe
{
    return {
        pack:     'ef',
        id:       def.id,
        evaluate: (_uid?: number): recipe_evaluation =>
        {
            return {
                valid:      true,
                duration:   def.time_seconds,
                inputs:     def.inputs.map((i) => ({ item_id: { pack: 'ef', id: i.item_id }, quantity: i.quantity })),
                outputs:    def.outputs.map((o) => ({ item_id: { pack: 'ef', id: o.item_id }, quantity: o.quantity })),
                other_info:
                {
                    ef:
                    {
                        machine:      def.machine,
                        time_seconds: def.time_seconds
                    }
                }
            };
        }
    };
}

/**
 * 取得所有 EF 產品之核心配方物件清單。
 */
export function get_all_ef_recipes(): recipe[]
{
    const recipes: recipe[] = [];
    for (const p of product_list)
    {
        for (const r_def of p.recipes)
        {
            recipes.push(recipe_def_to_recipe(r_def));
        }
    }
    return recipes;
}
