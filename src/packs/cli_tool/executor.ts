import type { pack_registry, map_command_factory } from '@/core';
import { get_registry, execute_command as api_execute_command } from '@/runtime';
import { tokenize_input, clean_flag_arg } from './parser';
import { format_cli_help } from './help';

function matches_alias(meta_alias: unknown, query: string): boolean
{
    if (typeof meta_alias === 'string')
    {
        return meta_alias.toLowerCase() === query;
    }
    if (Array.isArray(meta_alias))
    {
        return meta_alias.some(a => typeof a === 'string' && a.toLowerCase() === query);
    }
    return false;
}

/**
 * Finds a command factory from Core Command Registry by exact, namespaced or alias format.
 */
function find_command
(
    registry: pack_registry,
    query:    string
): { pack: string; id: string; factory: map_command_factory } | null
{
    const normalized = query.toLowerCase().replace(/-/g, '_');

    if (normalized.includes(':'))
    {
        const [pack, id] = normalized.split(':');
        const factory = registry.packs.get(pack)?.commands?.[id];
        if (factory)
        {
            return { pack, id, factory };
        }
        // Also check if id is an alias within that pack
        const mod = registry.packs.get(pack);
        if (mod?.commands)
        {
            for (const [cmd_id, cmd_factory] of Object.entries(mod.commands))
            {
                if (matches_alias((cmd_factory as any)?.other_info?.cli?.alias, id))
                {
                    return { pack, id: cmd_id, factory: cmd_factory };
                }
            }
        }
        return null;
    }

    // Search across all packs (by cmd_id or alias)
    const matches: Array<{ pack: string; id: string; factory: map_command_factory }> = [];
    for (const [pack_name, mod] of registry.packs)
    {
        if (mod.commands)
        {
            for (const [cmd_id, factory] of Object.entries(mod.commands))
            {
                const is_direct_match = cmd_id.toLowerCase() === normalized;
                const is_alias_match = matches_alias((factory as any)?.other_info?.cli?.alias, normalized);
                if (is_direct_match || is_alias_match)
                {
                    matches.push({ pack: pack_name, id: cmd_id, factory });
                }
            }
        }
    }

    if (matches.length === 1)
    {
        return matches[0];
    }
    if (matches.length > 1)
    {
        throw new Error(`Ambiguous command "${query}". Matches: ${matches.map(m => `${m.pack}:${m.id}`).join(', ')}`);
    }

    return null;
}

/**
 * Parses and executes a command string, returning a result message.
 * Fully standalone interface callable from code or browser DevTools Console.
 */
export function execute_command(input: string): string
{
    const trimmed = input.trim();
    if (trimmed === '')
    {
        return '';
    }

    const tokens = tokenize_input(trimmed);
    const cmd    = tokens[0];
    const args   = tokens.slice(1);

    const registry = get_registry();
    if (!registry)
    {
        return 'Error: Global pack registry not found.';
    }

    if (cmd.toLowerCase() === 'help')
    {
        return format_cli_help(registry);
    }

    try
    {
        const matched = find_command(registry, cmd);
        if (!matched)
        {
            return `Unknown command: "${cmd}". Type "help" to list available pack commands.`;
        }

        const cleaned_args = args.map(clean_flag_arg);
        const cmd_obj = matched.factory(...cleaned_args);
        api_execute_command(cmd_obj);
        return `Executed command "${matched.pack}:${matched.id}" successfully.`;
    }
    catch (err: unknown)
    {
        return `Error: ${(err as Error).message}`;
    }
}

// Auto-bind to DevTools Console in browser environment
if (typeof window !== 'undefined')
{
    (window as any).cli = execute_command;
}
