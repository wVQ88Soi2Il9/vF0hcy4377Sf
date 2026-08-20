import { get_available_recipes } from '@/packs/vanilla/recipe_query';

export type { available_recipe_entry } from './recipe_query';

export const vanilla =
{
    get_available_recipes
};

/**
 * Initialize the vanilla pack by registering its core logics to the engine hooks.
 * Called automatically by loader.ts — do not call manually.
 */
export function init_pack(): void
{
}
