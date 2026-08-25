import type { game_map, pack_registry, history_node, namespaced_id, map_command_factory } from '@/core';
import
{
    get_history_tree,
    execute_command as api_execute_command,
    undo as api_undo,
    redo as api_redo,
    jump_to_history,
    jump_to_prev_fork,
    jump_to_next_fork,
    delete_history_node
} from '@/runtime';
import { clean_flag_arg } from './parser';

export interface cli_context
{
    map:      game_map;
    registry: pack_registry;
}

export interface cli_command_spec
{
    name:        string;
    usage:       string;
    description: string;
    execute:     (args: string[], ctx: cli_context) => string;
}

function format_history_summary(): string
{
    const tree = get_history_tree();
    if (!tree)
    {
        return 'History tree not initialized.';
    }

    const lines: string[] = [`History Tree (Current UID: ${tree.current_uid}, Total Nodes: ${tree.nodes.size}):`];
    const sorted_nodes: history_node[] = Array.from(tree.nodes.values()).sort((a, b) => a.uid - b.uid);
    for (const node of sorted_nodes)
    {
        const is_current = node.uid === tree.current_uid;
        const prefix = is_current ? '-> ' : '   ';
        const label = node.command ? `${node.command.pack}:${node.command.id}` : 'root (initial)';
        const parent_info = node.parent_uid !== null ? ` (parent: ${node.parent_uid})` : '';
        const branches = node.children_uids.length > 1 ? ` [branches: ${node.children_uids.join(', ')}]` : '';
        lines.push(`${prefix}[#${node.uid}] ${label}${parent_info}${branches}`);
    }

    return lines.join('\n');
}

/**
 * Built-in Core History / State Navigation Commands
 */
export const CORE_BUILTIN_COMMANDS = new Map<string, cli_command_spec>();

function register_core_builtin(spec: cli_command_spec): void
{
    CORE_BUILTIN_COMMANDS.set(spec.name.toLowerCase(), spec);
}

// ── Undo ──────────────────────────────────────────────────────────────────────
register_core_builtin({
    name:        'undo',
    usage:       'undo',
    description: 'Undo the previous mutation in history tree.',
    execute()
    {
        const success = api_undo();
        return success ? 'Undo successful.' : 'Nothing to undo (already at root).';
    }
});

// ── Redo ──────────────────────────────────────────────────────────────────────
register_core_builtin({
    name:        'redo',
    usage:       'redo',
    description: 'Redo the next mutation along active branch.',
    execute()
    {
        const success = api_redo();
        return success ? 'Redo successful.' : 'Nothing to redo (at latest node in current branch).';
    }
});

// ── Prev Fork ────────────────────────────────────────────────────────────────
register_core_builtin({
    name:        'prev-fork',
    usage:       'prev-fork',
    description: 'Jump back to the previous fork node.',
    execute()
    {
        const success = jump_to_prev_fork();
        return success ? 'Jumped to previous fork point.' : 'No previous fork found.';
    }
});

// ── Next Fork ────────────────────────────────────────────────────────────────
register_core_builtin({
    name:        'next-fork',
    usage:       'next-fork',
    description: 'Jump forward to the next fork node.',
    execute()
    {
        const success = jump_to_next_fork();
        return success ? 'Jumped to next fork point.' : 'No downstream fork found.';
    }
});

// ── History ──────────────────────────────────────────────────────────────────
register_core_builtin({
    name:        'history',
    usage:       'history',
    description: 'Display history tree summary.',
    execute()
    {
        return format_history_summary();
    }
});

// ── Jump ─────────────────────────────────────────────────────────────────────
register_core_builtin({
    name:        'jump',
    usage:       'jump --"<node_uid>"',
    description: 'Jump to a specified history node UID.',
    execute(args)
    {
        if (args.length < 1)
        {
            return 'Usage: jump --"<node_uid>" (e.g. jump --"2")';
        }
        const uid_str = clean_flag_arg(args[0]);
        const target_uid = parseInt(uid_str, 10);
        if (isNaN(target_uid))
        {
            return 'Error: Invalid node UID. Must be a number (e.g. jump --"2").';
        }
        const success = jump_to_history(target_uid);
        return success ? `Jumped to history node #${target_uid}.` : `Error: Failed to jump to history node #${target_uid}.`;
    }
});

// ── Delete Node ──────────────────────────────────────────────────────────────
register_core_builtin({
    name:        'delete-node',
    usage:       'delete-node --"<node_uid>"',
    description: 'Delete a single node and reconnect its children to its parent.',
    execute(args)
    {
        if (args.length < 1)
        {
            return 'Usage: delete-node --"<node_uid>" (e.g. delete-node --"2")';
        }
        const uid_str = clean_flag_arg(args[0]);
        const target_uid = parseInt(uid_str, 10);
        if (isNaN(target_uid))
        {
            return 'Error: Invalid node UID. Must be a number (e.g. delete-node --"2").';
        }
        if (target_uid === 0)
        {
            return 'Error: Cannot delete root node (#0).';
        }
        const tree = get_history_tree();
        if (tree && target_uid === tree.current_uid)
        {
            return `Error: Cannot delete current active node (#${target_uid}). Please jump to another node first.`;
        }
        const success = delete_history_node(target_uid);
        return success ? `Successfully deleted history node #${target_uid}.` : `Error: Failed to delete history node #${target_uid} (node not found).`;
    }
});

/**
 * Parses raw string args into strongly typed arguments for map_command_factory.
 */
function parse_command_arguments
(
    raw_args: string[],
    registry: pack_registry,
    is_create_cmd: boolean
): any[]
{
    const cleaned_args = raw_args.map(clean_flag_arg);
    const parsed_args: any[] = [];

    for (let i = 0; i < cleaned_args.length; i++)
    {
        const arg = cleaned_args[i];

        // If create command first argument: definition_id (e.g. "test:assembler")
        if (is_create_cmd && i === 0)
        {
            const parts = arg.includes(':') ? arg.split(':') : ['global', arg];
            const ns_id: namespaced_id = { pack: parts[0], id: parts[1] };
            const dev_class = registry.packs.get(ns_id.pack)?.devices?.[ns_id.id];
            if (!dev_class)
            {
                throw new Error(`Device definition "${arg}" not found in pack registry.`);
            }
            parsed_args.push(dev_class);
            parsed_args.push(ns_id);
            continue;
        }

        if (arg.includes(','))
        {
            const vec = arg.split(',').map(s => Number(s.trim()));
            parsed_args.push(vec.some(isNaN) ? arg : vec);
        }
        else if (/^-?\d+$/.test(arg))
        {
            parsed_args.push(parseInt(arg, 10));
        }
        else if (arg === 'true')
        {
            parsed_args.push(true);
        }
        else if (arg === 'false')
        {
            parsed_args.push(false);
        }
        else
        {
            parsed_args.push(arg);
        }
    }

    return parsed_args;
}

/**
 * Searches and dynamically executes any command registered across Core Pack Registry.
 */
export function execute_pack_command
(
    cmd_query: string,
    raw_args:  string[],
    ctx:       cli_context
): string | null
{
    const normalized_query = cmd_query.toLowerCase().replace(/-/g, '_');
    const { registry, map } = ctx;

    let matched: { ns_id: namespaced_id; factory: map_command_factory } | null = null;

    if (normalized_query.includes(':'))
    {
        const [pack, id] = normalized_query.split(':');
        const factory = registry.packs.get(pack)?.commands?.[id];
        if (factory)
        {
            matched = { ns_id: { pack, id }, factory };
        }
    }
    else
    {
        const matches: Array<{ ns_id: namespaced_id; factory: map_command_factory }> = [];
        for (const [pack_name, mod] of registry.packs)
        {
            if (mod.commands)
            {
                for (const [cmd_id, factory] of Object.entries(mod.commands))
                {
                    const nid = cmd_id.toLowerCase();
                    if (
                        nid === normalized_query ||
                        nid === `${normalized_query}_device` ||
                        normalized_query === `${nid}_device`
                    )
                    {
                        matches.push({ ns_id: { pack: pack_name, id: cmd_id }, factory });
                    }
                }
            }
        }

        if (matches.length === 1)
        {
            matched = matches[0];
        }
        else if (matches.length > 1)
        {
            return `Error: Ambiguous command "${cmd_query}". Matches: ${matches.map(m => `"${m.ns_id.pack}:${m.ns_id.id}"`).join(', ')}.`;
        }
    }

    if (!matched)
    {
        return null;
    }

    try
    {
        const is_create = matched.ns_id.id.toLowerCase().includes('create');
        const parsed_args = parse_command_arguments(raw_args, registry, is_create);

        // Validation for position if present
        if (matched.ns_id.id.includes('create') || matched.ns_id.id.includes('move'))
        {
            const pos_arg = parsed_args.find(a => Array.isArray(a));
            if (pos_arg && pos_arg.length !== map.dimension)
            {
                return `Error: Invalid position dimension. Expected ${map.dimension} coordinates (got ${pos_arg.length}).`;
            }
        }

        const cmd_obj = matched.factory(...parsed_args);
        api_execute_command(cmd_obj);

        if (matched.ns_id.id === 'create_device')
        {
            const created = map.devices[map.devices.length - 1];
            return `Created device ${raw_args[0]} (ID: ${created.uid}) at [${created.position.join(', ')}]`;
        }
        else if (matched.ns_id.id === 'delete_device')
        {
            return `Deleted device ID ${raw_args[0]}`;
        }
        else if (matched.ns_id.id === 'move_device')
        {
            return `Moved device ID ${raw_args[0]} to [${raw_args[1]}]`;
        }
        else if (matched.ns_id.id === 'rotate_device')
        {
            return `Rotated device ID ${raw_args[0]}`;
        }
        else if (matched.ns_id.id === 'flip_device')
        {
            return `Flipped device ID ${raw_args[0]}`;
        }

        return `Executed "${matched.ns_id.pack}:${matched.ns_id.id}" successfully.`;
    }
    catch (err: unknown)
    {
        return `Error: ${(err as Error).message}`;
    }
}

/**
 * Dynamically builds help documentation from Core Built-ins and Core Pack Registry.
 */
export function format_cli_help(registry?: pack_registry): string
{
    const builtin_usages = Array.from(CORE_BUILTIN_COMMANDS.values()).map(s => s.usage);
    const lines: string[] = [
        'Available commands:',
        `[History] ${builtin_usages.join(', ')}, help`
    ];

    if (registry)
    {
        for (const [pack_name, mod] of registry.packs)
        {
            if (mod.commands && Object.keys(mod.commands).length > 0)
            {
                const cmd_list = Object.keys(mod.commands).map(id => `${pack_name}:${id}`);
                lines.push(`[${pack_name}] ${cmd_list.join(', ')}`);
            }
        }
    }

    return lines.join('\n');
}
