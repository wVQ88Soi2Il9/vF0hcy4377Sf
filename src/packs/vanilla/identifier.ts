import type { namespaced_id } from '@/core';

/**
 * Parses a string in "pack:id" format into a structured namespaced_id.
 * If no colon is present, uses default_pack.
 */
export function parse_namespaced_id(identifier: string, default_pack: string = 'core'): namespaced_id
{
    const idx = identifier.indexOf(':');
    if (idx !== -1)
    {
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

/**
 * Formats a namespaced_id object into standard "pack:id" string.
 */
export function format_namespaced_id(identifier: namespaced_id): string
{
    return `${identifier.pack}:${identifier.id}`;
}
