import type { item_definition, recipe, recipe_evaluation, namespaced_id, pack_module, device_constructor } from '@/core/types';

export type { device_constructor };

export interface pack_registry
{
    packs: Map<string, pack_module>;
}

/**
 * 建立一個空的 registry，採用單一 pack_module 字典結構
 */
export function create_pack_registry(): pack_registry
{
    return {
        packs: new Map()
    };
}

/**
 * 註冊一個 pack_module 物件進 registry。
 */
export function register_pack(registry: pack_registry, mod: pack_module): void
{
    registry.packs.set(mod.id, mod);
}

/**
 * 檢查物品定義是否存在於指定 registry
 */
export function has_item(registry: pack_registry, identifier: namespaced_id): boolean
{
    return Boolean(registry.packs.get(identifier.pack)?.items?.[identifier.id]);
}

/**
 * 取得物品定義，若不存在則拋出例外 (Fail-Fast)
 */
export function get_item(registry: pack_registry, identifier: namespaced_id): item_definition
{
    const item = registry.packs.get(identifier.pack)?.items?.[identifier.id];
    if (!item)
    {
        throw new Error(`Item "${identifier.pack}:${identifier.id}" not found in registry.`);
    }
    return item;
}

/**
 * 檢查配方定義是否存在於指定 registry
 */
export function has_recipe(registry: pack_registry, identifier: namespaced_id): boolean
{
    return Boolean(registry.packs.get(identifier.pack)?.recipes?.[identifier.id]);
}

/**
 * 取得配方定義，若不存在則拋出例外 (Fail-Fast)
 */
export function get_recipe(registry: pack_registry, identifier: namespaced_id): recipe
{
    const rec = registry.packs.get(identifier.pack)?.recipes?.[identifier.id];
    if (!rec)
    {
        throw new Error(`Recipe "${identifier.pack}:${identifier.id}" not found in registry.`);
    }
    return rec;
}

/**
 * 檢查裝置類別是否存在於指定 registry
 */
export function has_device_class(registry: pack_registry, identifier: namespaced_id): boolean
{
    return Boolean(registry.packs.get(identifier.pack)?.devices?.[identifier.id]);
}

/**
 * 取得裝置類別建構子，若不存在則拋出例外 (Fail-Fast)
 */
export function get_device_class(registry: pack_registry, identifier: namespaced_id): device_constructor
{
    const cls = registry.packs.get(identifier.pack)?.devices?.[identifier.id];
    if (!cls)
    {
        throw new Error(`Device class "${identifier.pack}:${identifier.id}" not found in registry.`);
    }
    return cls;
}

/**
 * 註冊單一配方至 registry
 */
export function register_recipe
(
    registry: pack_registry,
    recipe:   recipe
): void
{
    let mod = registry.packs.get(recipe.pack);
    if (!mod)
    {
        mod = { id: recipe.pack, recipes: {} };
        registry.packs.set(recipe.pack, mod);
    }
    if (!mod.recipes)
    {
        mod.recipes = {};
    }
    mod.recipes[recipe.id] = recipe;
}

/**
 * 註冊單一裝置類別至 registry
 */
export function register_device_class
(
    registry:     pack_registry,
    identifier:   namespaced_id,
    device_class: device_constructor
): void
{
    let mod = registry.packs.get(identifier.pack);
    if (!mod)
    {
        mod = { id: identifier.pack, devices: {} };
        registry.packs.set(identifier.pack, mod);
    }
    if (!mod.devices)
    {
        mod.devices = {};
    }
    mod.devices[identifier.id] = device_class;
}

/**
 * 評估指定配方在指定裝置實體（uid）或全局上下文中的結果。
 */
export function evaluate_recipe
(
    registry:   pack_registry,
    identifier: namespaced_id,
    uid?:       number
): recipe_evaluation
{
    const rec = get_recipe(registry, identifier);
    return rec.evaluate(uid);
}
