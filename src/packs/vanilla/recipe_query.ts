import type { recipe, recipe_evaluation, pack_registry } from '@/API';
import { get_registry } from '@/runtime';

export interface available_recipe_entry
{
    recipe:     recipe;
    evaluation: recipe_evaluation;
}

/**
 * 取得指定裝置實體（uid）或全局環境下所有相容可用的配方與即時評估結果。
 */
export function get_available_recipes
(
    registry?: pack_registry,
    uid?: number
): available_recipe_entry[]
{
    const target_registry = registry ?? get_registry();
    if (!target_registry)
    {
        return [];
    }

    const results: available_recipe_entry[] = [];

    for (const pack_map of target_registry.recipes.values())
    {
        for (const rec of pack_map.values())
        {
            const eval_result = rec.evaluate(uid);
            if (eval_result.valid)
            {
                results.push
                ({
                    recipe: rec,
                    evaluation: eval_result
                });
            }
        }
    }

    return results;
}
