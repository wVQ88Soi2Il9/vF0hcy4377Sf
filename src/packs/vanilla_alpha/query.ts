/**
 * src/packs/vanilla_alpha/query.ts — 命名空間標識解析與註冊表安全查詢工具
 */

import * as core from '@/core';

// ── 命名空間標識工具 ─────────────────────────────────────────────────────────

/**
 * 將 "pack:id" 字串解析為結構化的 namespaced_id。
 * 若字串無冒號，預設以 default_pack 作為 namespace。
 */
export function parse_namespaced_id(identifier: string, default_pack: string = 'core'): core.namespaced_id
{
    const idx = identifier.indexOf(':');
    if (idx !== -1)
    {
        return {
            namespace: identifier.slice(0, idx),
            id:        identifier.slice(idx + 1)
        };
    }
    return {
        namespace: default_pack,
        id:        identifier
    };
}

/**
 * 將 namespaced_id 格式化為標準 "namespace:id" 字串。
 */
export function format_namespaced_id(identifier: core.namespaced_id): string
{
    return `${identifier.namespace}:${identifier.id}`;
}

// ── 註冊表查詢工具 (Fail-Fast) ────────────────────────────────────────────────

/**
 * 檢查物品定義是否存在於指定 registry
 */
export function has_item(registry: core.pack_registry, identifier: core.namespaced_id): boolean
{
    return Boolean(registry.packs.get(identifier.namespace)?.items?.[identifier.id]);
}

/**
 * 取得物品定義，若不存在則拋出例外 (Fail-Fast)
 */
export function get_item(registry: core.pack_registry, identifier: core.namespaced_id): core.item_definition
{
    const item = registry.packs.get(identifier.namespace)?.items?.[identifier.id];
    if (!item)
    {
        throw new Error(`Item "${format_namespaced_id(identifier)}" not found in registry.`);
    }
    return item;
}

/**
 * 檢查配方定義是否存在於指定 registry
 */
export function has_recipe(registry: core.pack_registry, identifier: core.namespaced_id): boolean
{
    return Boolean(registry.packs.get(identifier.namespace)?.recipes?.[identifier.id]);
}

/**
 * 取得配方定義，若不存在則拋出例外 (Fail-Fast)
 */
export function get_recipe(registry: core.pack_registry, identifier: core.namespaced_id): core.recipe
{
    const rec = registry.packs.get(identifier.namespace)?.recipes?.[identifier.id];
    if (!rec)
    {
        throw new Error(`Recipe "${format_namespaced_id(identifier)}" not found in registry.`);
    }
    return rec;
}

/**
 * 檢查裝置類別是否存在於指定 registry
 */
export function has_device_class(registry: core.pack_registry, identifier: core.namespaced_id): boolean
{
    return Boolean(registry.packs.get(identifier.namespace)?.devices?.[identifier.id]);
}

/**
 * 取得裝置類別建構子，若不存在則拋出例外 (Fail-Fast)
 */
export function get_device_class(registry: core.pack_registry, identifier: core.namespaced_id): core.device_constructor
{
    const cls = registry.packs.get(identifier.namespace)?.devices?.[identifier.id];
    if (!cls)
    {
        throw new Error(`Device class "${format_namespaced_id(identifier)}" not found in registry.`);
    }
    return cls;
}

/**
 * 檢查操作工廠是否存在於指定 registry
 */
export function has_operation(registry: core.pack_registry, identifier: core.namespaced_id): boolean
{
    return Boolean(registry.packs.get(identifier.namespace)?.operations?.[identifier.id]);
}

/**
 * 取得操作工廠，若不存在則拋出例外 (Fail-Fast)
 */
export function get_operation(registry: core.pack_registry, identifier: core.namespaced_id): core.reversible_operation_factory
{
    const op = registry.packs.get(identifier.namespace)?.operations?.[identifier.id];
    if (!op)
    {
        throw new Error(`Operation "${format_namespaced_id(identifier)}" not found in registry.`);
    }
    return op;
}
