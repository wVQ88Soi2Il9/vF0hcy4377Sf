import * as core from '@/core';

/**
 * Parses a string in "pack:id" format into a structured namespaced_id.
 * If no colon is present, uses default_pack.
 */
export function parse_namespaced_id(identifier: string, default_pack: string = 'core'): core.namespaced_id
{
    const idx = identifier.indexOf(':');
    if (idx !== -1)
    {
        return {
            namespace: identifier.slice(0, idx),
            id:   identifier.slice(idx + 1)
        };
    }
    return {
        namespace: default_pack,
        id:   identifier
    };
}

/**
 * Formats a namespaced_id object into standard "pack:id" string.
 */
export function format_namespaced_id(identifier: core.namespaced_id): string
{
    return `${identifier.namespace}:${identifier.id}`;
}
