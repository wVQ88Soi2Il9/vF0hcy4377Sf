import * as core from '@/core';
import * as world from '@/world';

export interface available_recipe_entry
{
    recipe:     core.recipe;
    evaluation: any;
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

    for (const mod of target_registry.packs.values())
    {
        if (mod.recipes)
        {
            for (const rec of Object.values(mod.recipes))
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
    }

    return results;
}
