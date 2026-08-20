import type { pack, item_definition, recipe, recipe_evaluation, device, vector } from '@/core/types';

export type device_constructor = new
(
    uid:           number,
    definition_id: string,
    position:      vector,
    other_info?:   Record<string, unknown>
) => device;

export interface pack_registry
{
    loaded_packs:   Map<string, pack>;
    items:          Map<string, item_definition>;
    recipes:        Map<string, recipe>;
    device_classes: Map<string, device_constructor>;
}

/**
 * 建立一個空的 registry，用來存放所有的定義與類別資料
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
 * 由於每個 ID 都帶有 pack name 為前綴，不會有衝突。
 * 若載入相同 ID 的 pack，會先將舊的解除安裝，支援熱插拔。
 */
export function load_pack(registry: pack_registry, new_pack: pack): void
{
    if (registry.loaded_packs.has(new_pack.id))
    {
        unload_pack(registry, new_pack.id);
    }

    registry.loaded_packs.set(new_pack.id, new_pack);

    for (const item of new_pack.items)
    {
        registry.items.set(item.id, item);
    }

    for (const rec of new_pack.recipes)
    {
        registry.recipes.set(rec.id, rec);
    }
}

/**
 * 將指定的 pack 從 registry 中移除，支援熱插拔。
 */
export function unload_pack(registry: pack_registry, pack_id: string): void
{
    const p = registry.loaded_packs.get(pack_id);
    if (!p)
    {
        return;
    }

    for (const item of p.items)
    {
        registry.items.delete(item.id);
    }

    for (const rec of p.recipes)
    {
        registry.recipes.delete(rec.id);
    }

    registry.loaded_packs.delete(pack_id);
}

/**
 * 透過 ID 取得物品定義
 */
export function get_item(registry: pack_registry, id: string): item_definition | undefined
{
    return registry.items.get(id);
}

/**
 * 透過 ID 取得配方定義
 */
export function get_recipe(registry: pack_registry, id: string): recipe | undefined
{
    return registry.recipes.get(id);
}

/**
 * 直接註冊單一配方至 registry
 */
export function register_recipe(registry: pack_registry, recipe: recipe): void
{
    registry.recipes.set(recipe.id, recipe);
}

/**
 * 直接註冊單一裝置類別至 registry
 */
export function register_device_class(registry: pack_registry, id: string, device_class: device_constructor): void
{
    registry.device_classes.set(id, device_class);
}

/**
 * 透過 ID 取得裝置類別建構子
 */
export function get_device_class(registry: pack_registry, id: string): device_constructor | undefined
{
    return registry.device_classes.get(id);
}

/**
 * 評估指定配方在指定裝置實體（uid）或全局上下文中的結果。
 * 若配方不存在則回傳 undefined。
 */
export function evaluate_recipe
(
    registry: pack_registry,
    recipe_id: string,
    uid?: number
): recipe_evaluation | undefined
{
    const rec = registry.recipes.get(recipe_id);
    if (!rec)
    {
        return undefined;
    }
    return rec.evaluate(uid);
}
