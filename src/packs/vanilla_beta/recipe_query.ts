/**
 * src/packs/vanilla_beta/recipe_query.ts — 配方查詢工具
 */

import * as core from '@/core';

export interface available_recipe_entry
{
    recipe:     core.recipe;
    evaluation: any;
}

/**
 * 取得指定裝置實體（device_uid）在指定 registry 下所有可用的配方。
 */
export function get_available_recipes
(
    registry:    core.pack_registry,
    device_uid?: core.uid
): available_recipe_entry[]
{
    if (!registry)
    {
        return [];
    }

    const results: available_recipe_entry[] = [];

    for (const mod of registry.packs.values())
    {
        if (mod.recipes)
        {
            for (const rec of Object.values(mod.recipes))
            {
                const eval_result = typeof rec.evaluate === 'function' ? rec.evaluate(device_uid!) : undefined;
                results.push
                ({
                    recipe:     rec as core.recipe,
                    evaluation: eval_result
                });
            }
        }
    }

    return results;
}
