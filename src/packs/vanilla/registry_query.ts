import type {
    item_definition,
    recipe,
    recipe_evaluation,
    namespaced_id,
    device_constructor,
    map_command_factory,
    pack_registry
} from '@/core';

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
 * 檢查指令工廠是否存在於指定 registry
 */
export function has_command(registry: pack_registry, identifier: namespaced_id): boolean
{
    return Boolean(registry.packs.get(identifier.pack)?.commands?.[identifier.id]);
}

/**
 * 取得指令工廠，若不存在則拋出例外 (Fail-Fast)
 */
export function get_command(registry: pack_registry, identifier: namespaced_id): map_command_factory
{
    const cmd = registry.packs.get(identifier.pack)?.commands?.[identifier.id];
    if (!cmd)
    {
        throw new Error(`Command "${identifier.pack}:${identifier.id}" not found in registry.`);
    }
    return cmd;
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
