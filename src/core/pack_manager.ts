import type { pack, item_definition, recipe, device_definition } from './types'

// Temporary in-memory registries to mock JSON loaded data
const items_registry = new Map<string, item_definition>()
const recipes_registry = new Map<string, recipe>()
const devices_registry = new Map<string, device_definition>()

/**
 * Loads a complete pack into the global registry.
 * This simulates reading a JSON pack file.
 */
export function load_pack(p: pack): void
{
    for (const item of p.items)
    {
        items_registry.set(item.id, item)
    }
    
    for (const recipe of p.recipes)
    {
        recipes_registry.set(recipe.id, recipe)
    }
    
    for (const def of p.device_definitions)
    {
        devices_registry.set(def.id, def)
    }
}

/**
 * Looks up an item definition by its ID.
 * @throws If the item is not found.
 */
export function get_item_definition(id: string): item_definition
{
    const def = items_registry.get(id)
    if (!def)
    {
        throw new Error(`Item definition '${id}' not found in any loaded pack.`)
    }
    return def
}

/**
 * Looks up a recipe by its ID.
 * @throws If the recipe is not found.
 */
export function get_recipe(id: string): recipe
{
    const def = recipes_registry.get(id)
    if (!def)
    {
        throw new Error(`Recipe '${id}' not found in any loaded pack.`)
    }
    return def
}

/**
 * Looks up a device definition by its ID.
 * @throws If the definition is not found.
 */
export function get_device_definition(id: string): device_definition
{
    const def = devices_registry.get(id)
    if (!def)
    {
        throw new Error(`Device definition '${id}' not found in any loaded pack.`)
    }
    return def
}
