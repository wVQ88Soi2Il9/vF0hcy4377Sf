import type { pack, item_definition, recipe, recipe_evaluation, device, vector, namespaced_id } from '@/core/types';

export type device_constructor = new
(
    uid:           number,
    definition_id: string,
    position:      vector,
    other_info?:   Record<string, unknown>,
    pack?:         string
) => device;

/**
 * Parses a string or namespaced_id object into a structured namespaced_id.
 */
export function resolve_namespaced_id(identifier: string | namespaced_id, default_pack: string = 'core'): namespaced_id
{
    if (typeof identifier !== 'string')
    {
        return identifier;
    }
    if (identifier.includes(':'))
    {
        const idx = identifier.indexOf(':');
        return {
            pack: identifier.slice(0, idx),
            id:   identifier.slice(idx + 1)
        };
    }
    return {
        pack: default_pack,
        id:   identifier
    };
}

export interface pack_registry
{
    loaded_packs:   Map<string, pack>;
    items:          Map<string, Map<string, item_definition>>;
    recipes:        Map<string, Map<string, recipe>>;
    device_classes: Map<string, Map<string, device_constructor>>;
}

/**
 * 建立一個空的 registry，採用兩層 Map 結構 (Pack ID -> Resource ID -> Definition)
 */
export function create_pack_registry(): pack_registry
{
    return {
        loaded_packs:   new Map(),
        items:          new Map(),
        recipes:        new Map(),
        device_classes: new Map()
    };
}

/**
 * 載入一個新的 pack 進 registry。
 * 若載入相同 ID 的 pack，會先將舊的解除安裝，支援熱插拔。
 */
export function load_pack(registry: pack_registry, new_pack: pack): void
{
    if (registry.loaded_packs.has(new_pack.id))
    {
        unload_pack(registry, new_pack.id);
    }

    registry.loaded_packs.set(new_pack.id, new_pack);

    let pack_items = registry.items.get(new_pack.id);
    if (!pack_items)
    {
        pack_items = new Map();
        registry.items.set(new_pack.id, pack_items);
    }

    for (const item of new_pack.items)
    {
        const item_id = item.id.includes(':') ? item.id.split(':')[1] : item.id;
        item.pack = new_pack.id;
        item.id = item_id;
        pack_items.set(item_id, item);
    }

    let pack_recipes = registry.recipes.get(new_pack.id);
    if (!pack_recipes)
    {
        pack_recipes = new Map();
        registry.recipes.set(new_pack.id, pack_recipes);
    }

    for (const rec of new_pack.recipes)
    {
        const rec_id = rec.id.includes(':') ? rec.id.split(':')[1] : rec.id;
        rec.pack = new_pack.id;
        rec.id = rec_id;
        pack_recipes.set(rec_id, rec);
    }
}

/**
 * 將指定的 pack 從 registry 中移除，支援熱插拔。
 * 直接以 O(1) 刪除整個 pack 專屬子 Map。
 */
export function unload_pack(registry: pack_registry, pack_id: string): void
{
    registry.loaded_packs.delete(pack_id);
    registry.items.delete(pack_id);
    registry.recipes.delete(pack_id);
    registry.device_classes.delete(pack_id);
}

/**
 * 取得物品定義，支援字串 ("test:iron_plate") 或物件 ({ pack: "test", id: "iron_plate" })
 */
export function get_item(registry: pack_registry, identifier: string | namespaced_id, optional_id?: string): item_definition | undefined
{
    if (typeof identifier === 'string' && optional_id !== undefined)
    {
        return registry.items.get(identifier)?.get(optional_id);
    }
    const resolved = resolve_namespaced_id(identifier);
    return registry.items.get(resolved.pack)?.get(resolved.id);
}

/**
 * 取得配方定義，支援字串 ("test:smelt_iron") 或物件 ({ pack: "test", id: "smelt_iron" })
 */
export function get_recipe(registry: pack_registry, identifier: string | namespaced_id, optional_id?: string): recipe | undefined
{
    if (typeof identifier === 'string' && optional_id !== undefined)
    {
        return registry.recipes.get(identifier)?.get(optional_id);
    }
    const resolved = resolve_namespaced_id(identifier);
    return registry.recipes.get(resolved.pack)?.get(resolved.id);
}

/**
 * 直接註冊單一配方至 registry
 */
export function register_recipe(registry: pack_registry, recipe: recipe): void
{
    const pack_name = recipe.pack ?? (recipe.id.includes(':') ? recipe.id.split(':')[0] : 'core');
    const local_id = recipe.id.includes(':') ? recipe.id.split(':')[1] : recipe.id;
    recipe.pack = pack_name;
    recipe.id = local_id;

    let pack_map = registry.recipes.get(pack_name);
    if (!pack_map)
    {
        pack_map = new Map();
        registry.recipes.set(pack_name, pack_map);
    }
    pack_map.set(local_id, recipe);
}

/**
 * 註冊單一裝置類別至 registry，支援 (registry, "test:assembler", class) 或 (registry, "test", "assembler", class)
 */
export function register_device_class
(
    registry:      pack_registry,
    identifier:    string | namespaced_id,
    device_class:  device_constructor,
    optional_cls?: device_constructor
): void
{
    let pack_name: string;
    let local_id: string;
    let cls: device_constructor;

    if (typeof identifier === 'string' && typeof device_class === 'string' && optional_cls)
    {
        pack_name = identifier;
        local_id = device_class as unknown as string;
        cls = optional_cls;
    }
    else
    {
        const resolved = resolve_namespaced_id(identifier);
        pack_name = resolved.pack;
        local_id = resolved.id;
        cls = device_class;
    }

    let pack_map = registry.device_classes.get(pack_name);
    if (!pack_map)
    {
        pack_map = new Map();
        registry.device_classes.set(pack_name, pack_map);
    }
    pack_map.set(local_id, cls);
}

/**
 * 透過 ID 取得裝置類別建構子，支援字串 ("test:assembler") 或物件 ({ pack: "test", id: "assembler" })
 */
export function get_device_class(registry: pack_registry, identifier: string | namespaced_id, optional_id?: string): device_constructor | undefined
{
    if (typeof identifier === 'string' && optional_id !== undefined)
    {
        return registry.device_classes.get(identifier)?.get(optional_id);
    }
    const resolved = resolve_namespaced_id(identifier);
    return registry.device_classes.get(resolved.pack)?.get(resolved.id);
}

/**
 * 評估指定配方在指定裝置實體（uid）或全局上下文中的結果。
 */
export function evaluate_recipe
(
    registry:    pack_registry,
    identifier:  string | namespaced_id,
    uid?:        number
): recipe_evaluation | undefined
{
    const rec = get_recipe(registry, identifier);
    if (!rec)
    {
        return undefined;
    }
    return rec.evaluate(uid);
}
