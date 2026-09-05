import * as core from '@/core';

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

export function format_namespaced_id(identifier: core.namespaced_id): string
{
    return `${identifier.namespace}:${identifier.id}`;
}

export function has_item(registry: core.pack_registry, identifier: core.namespaced_id): boolean
{
    return Boolean(registry.get(identifier.namespace)?.items?.[identifier.id]);
}

export function get_item(registry: core.pack_registry, identifier: core.namespaced_id): core.item_definition
{
    const item = registry.get(identifier.namespace)?.items?.[identifier.id];
    if (!item)
    {
        throw new Error(`Item "${format_namespaced_id(identifier)}" not found in registry.`);
    }
    return item;
}

export function has_recipe(registry: core.pack_registry, identifier: core.namespaced_id): boolean
{
    return Boolean(registry.get(identifier.namespace)?.recipes?.[identifier.id]);
}

export function get_recipe(registry: core.pack_registry, identifier: core.namespaced_id): core.recipe
{
    const rec = registry.get(identifier.namespace)?.recipes?.[identifier.id];
    if (!rec)
    {
        throw new Error(`Recipe "${format_namespaced_id(identifier)}" not found in registry.`);
    }
    return rec;
}

export function has_device_class(registry: core.pack_registry, identifier: core.namespaced_id): boolean
{
    return Boolean(registry.get(identifier.namespace)?.devices?.[identifier.id]);
}

export function get_device_class(registry: core.pack_registry, identifier: core.namespaced_id): core.device_constructor
{
    const cls = registry.get(identifier.namespace)?.devices?.[identifier.id];
    if (!cls)
    {
        throw new Error(`Device class "${format_namespaced_id(identifier)}" not found in registry.`);
    }
    return cls;
}

export function has_operation(registry: core.pack_registry, identifier: core.namespaced_id): boolean
{
    return Boolean(registry.get(identifier.namespace)?.operations?.[identifier.id]);
}

export function get_operation(registry: core.pack_registry, identifier: core.namespaced_id): core.rev_op
{
    const op = registry.get(identifier.namespace)?.operations?.[identifier.id];
    if (!op)
    {
        throw new Error(`Operation "${format_namespaced_id(identifier)}" not found in registry.`);
    }
    return op;
}
