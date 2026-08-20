import type { pack, item_definition, recipe, recipe_evaluation, device_definition } from '@/core/types';

export interface pack_registry
{
    loaded_packs:       Map<string, pack>;
    items:              Map<string, item_definition>;
    recipes:            Map<string, recipe>;
    device_definitions: Map<string, device_definition>;
}

/**
 * OOP Pack Registry class managing loaded packs, definitions, items, and recipes.
 */
export class pack_registry_instance implements pack_registry
{
    public loaded_packs:       Map<string, pack>;
    public items:              Map<string, item_definition>;
    public recipes:            Map<string, recipe>;
    public device_definitions: Map<string, device_definition>;

    constructor()
    {
        this.loaded_packs       = new Map();
        this.items              = new Map();
        this.recipes            = new Map();
        this.device_definitions = new Map();
    }

    /**
     * Loads a pack into registry.
     */
    public load_pack(new_pack: pack): void
    {
        if (this.loaded_packs.has(new_pack.id))
        {
            this.unload_pack(new_pack.id);
        }

        this.loaded_packs.set(new_pack.id, new_pack);

        for (const item of new_pack.items)
        {
            this.items.set(item.id, item);
        }

        for (const rec of new_pack.recipes)
        {
            this.recipes.set(rec.id, rec);
        }

        for (const dev of new_pack.device_definitions)
        {
            this.device_definitions.set(dev.id, dev);
        }
    }

    /**
     * Unloads a pack by its id.
     */
    public unload_pack(pack_id: string): void
    {
        const p = this.loaded_packs.get(pack_id);
        if (!p)
        {
            return;
        }

        for (const item of p.items)
        {
            this.items.delete(item.id);
        }

        for (const rec of p.recipes)
        {
            this.recipes.delete(rec.id);
        }

        for (const dev of p.device_definitions)
        {
            this.device_definitions.delete(dev.id);
        }

        this.loaded_packs.delete(pack_id);
    }

    /**
     * Gets an item definition by id.
     */
    public get_item(id: string): item_definition | undefined
    {
        return this.items.get(id);
    }

    /**
     * Gets a recipe definition by id.
     */
    public get_recipe(id: string): recipe | undefined
    {
        return this.recipes.get(id);
    }

    /**
     * Directly registers a single recipe.
     */
    public register_recipe(recipe: recipe): void
    {
        this.recipes.set(recipe.id, recipe);
    }

    /**
     * Gets a device definition by id.
     */
    public get_device_definition(id: string): device_definition | undefined
    {
        return this.device_definitions.get(id);
    }

    /**
     * Evaluates a recipe dynamically for a placed device instance (uid).
     */
    public evaluate_recipe(recipe_id: string, uid?: number): recipe_evaluation | undefined
    {
        const rec = this.recipes.get(recipe_id);
        if (!rec)
        {
            return undefined;
        }
        return rec.evaluate(uid);
    }
}

/**
 * Procedural API delegates (delegating directly to pack_registry_instance).
 */
export const create_pack_registry = (): pack_registry => new pack_registry_instance();

export const load_pack = (registry: pack_registry, new_pack: pack): void =>
    (registry as pack_registry_instance).load_pack(new_pack);

export const unload_pack = (registry: pack_registry, pack_id: string): void =>
    (registry as pack_registry_instance).unload_pack(pack_id);

export const get_item = (registry: pack_registry, id: string): item_definition | undefined =>
    (registry as pack_registry_instance).get_item(id);

export const get_recipe = (registry: pack_registry, id: string): recipe | undefined =>
    (registry as pack_registry_instance).get_recipe(id);

export const register_recipe = (registry: pack_registry, recipe: recipe): void =>
    (registry as pack_registry_instance).register_recipe(recipe);

export const get_device_definition = (registry: pack_registry, id: string): device_definition | undefined =>
    (registry as pack_registry_instance).get_device_definition(id);

export const evaluate_recipe =
(
    registry:  pack_registry,
    recipe_id: string,
    uid?:      number
): recipe_evaluation | undefined => (registry as pack_registry_instance).evaluate_recipe(recipe_id, uid);

