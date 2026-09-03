import type { pack_registry, map_command_factory, namespaced_id, device_constructor } from '@/core';
import
{
    get_registry,
    get_map,
    get_dimension,
    get_history_tree,
    execute_command as api_execute_command,
    undo,
    redo,
    jump_to_history,
    jump_to_prev_fork,
    jump_to_next_fork,
    jump_to_root,
    jump_to_leaf,
    delete_history_node
} from '@/world';
import { tokenize_input, parse_vector, parse_integer } from './parser';
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

function resolve_device_class
(
    registry: pack_registry,
    query:    string
): { dev_class: device_constructor; ns_id: namespaced_id }
{
    if (query.includes(':'))
    {
        const [pack, id] = query.split(':');
        const dev_class = registry.packs.get(pack)?.devices?.[id];
        if (!dev_class)
        {
            throw new Error(`Device "${query}" not found in registry.`);
        }
        return { dev_class, ns_id: { namespace: pack, id } };
    }

    const matches: Array<{ dev_class: device_constructor; ns_id: namespaced_id }> = [];
    for (const [pack_name, mod] of registry.packs)
    {
        if (mod.devices && mod.devices[query])
        {
            matches.push({ dev_class: mod.devices[query], ns_id: { namespace: pack_name, id: query } });
        }
    }

    if (matches.length === 1)
    {
        return matches[0];
    }
    if (matches.length > 1)
    {
        throw new Error(`Ambiguous device "${query}". Matches: ${matches.map(m => `${m.ns_id.namespace}:${m.ns_id.id}`).join(', ')}`);
    }

    throw new Error(`Device "${query}" not found in any loaded pack.`);
}

function execute_runtime_navigation(cmd: string, args: string[]): string | null
{
    switch (cmd)
    {
        case 'undo':
            return undo() ? 'Undo: reverted 1 step.' : 'Undo: already at the root of history.';
        case 'redo':
            return redo() ? 'Redo: stepped forward 1 step.' : 'Redo: already at the latest state.';
        case 'jump_to_history':
        {
            if (args.length === 0) throw new Error('Usage: jump_to_history <node_uid>');
            const uid = parse_integer(args[0], 'Node UID');
            return jump_to_history(uid) ? `Jumped to history node #${uid}.` : `Failed to jump: node #${uid} not found.`;
        }
        case 'jump_to_prev_fork':
            return jump_to_prev_fork() ? 'Jumped to previous fork.' : 'No previous fork found in history ancestry.';
        case 'jump_to_next_fork':
            return jump_to_next_fork() ? 'Jumped to next fork.' : 'No forward fork found along this branch.';
        case 'jump_to_root':
            return jump_to_root() ? 'Jumped to history root (node 0).' : 'Already at root.';
        case 'jump_to_leaf':
            return jump_to_leaf() ? 'Jumped to branch leaf node.' : 'Already at leaf.';
        case 'delete_history_node':
        {
            if (args.length === 0) throw new Error('Usage: delete_history_node <node_uid>');
            const uid = parse_integer(args[0], 'Node UID');
            return delete_history_node(uid) ? `Deleted history node #${uid}.` : `Failed to delete node #${uid}.`;
        }
        case 'history':
        {
            const tree = get_history_tree();
            return tree ? `History: ${tree.nodes.size} nodes. Active: #${tree.current_uid}.` : 'History tree not initialized.';
        }
        default:
            return null;
    }
}

/**
 * Pure generic command executor: parses input, resolves commands from Core Registry,
 * and dynamically dispatches without hardcoded pack business logic.
 */
export function execute_command(input: string): string
{
    const trimmed = input.trim();
    if (trimmed === '')
    {
        return '';
    }

    const tokens = tokenize_input(trimmed);
    const cmd    = tokens[0].toLowerCase().replace(/-/g, '_');
    const args   = tokens.slice(1);

    const registry = get_registry();
    if (!registry)
    {
        return 'Error: Global pack registry not found.';
    }

    if (cmd === 'help')
    {
        return format_cli_help(registry);
    }

    try
    {
        // 1. History & runtime navigation commands (no aliases for core/history)
        const runtime_res = execute_runtime_navigation(cmd, args);
        if (runtime_res !== null)
        {
            return runtime_res;
        }

        // 2. Lookup command factory from Core Command Registry
        const matched = find_command(registry, cmd);
        if (!matched)
        {
            return `Unknown command: "${tokens[0]}". Type "help" to list available commands.`;
        }

        // 3. Invoke factory with proper argument adaptation
        let cmd_obj;
        if (matched.pack === 'core' && matched.id === 'create_device')
        {
            if (args.length < 2) throw new Error('Usage: create_device <device_id> <x> <y> [z...]');
            const { dev_class, ns_id } = resolve_device_class(registry, args[0]);
            const dim = get_dimension() ?? get_map()?.dimension ?? 3;
            const pos = parse_vector(args.slice(1), dim);
            cmd_obj = matched.factory(dev_class, ns_id, pos);
        }
        else if (matched.pack === 'core' && matched.id === 'move_device')
        {
            if (args.length < 2) throw new Error('Usage: move_device <device_uid> <x> <y> [z...]');
            const uid = parse_integer(args[0], 'Device UID');
            const dim = get_dimension() ?? get_map()?.dimension ?? 3;
            const pos = parse_vector(args.slice(1), dim);
            cmd_obj = matched.factory(uid, pos);
        }
        else if (matched.pack === 'core' && matched.id === 'delete_device')
        {
            if (args.length === 0) throw new Error('Usage: delete_device <device_uid>');
            cmd_obj = matched.factory(parse_integer(args[0], 'Device UID'));
        }
        else if (matched.pack === 'core' && matched.id === 'select_recipe')
        {
            if (args.length === 0) throw new Error('Usage: select_recipe <device_uid> [recipe_id]');
            const uid = parse_integer(args[0], 'Device UID');
            const recipe_id = args.length > 1 && args[1].trim() !== ''
                ? { pack: args[1].includes(':') ? args[1].split(':')[0] : 'vanilla', id: args[1].includes(':') ? args[1].split(':')[1] : args[1] }
                : undefined;
            cmd_obj = matched.factory(uid, recipe_id);
        }
        else
        {
            // Generic dispatch for all downstream pack commands
            cmd_obj = matched.factory(...args);
        }

        api_execute_command(cmd_obj);
        return (cmd_obj as any).result_text || `Executed command "${matched.pack}:${matched.id}" successfully.`;
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
