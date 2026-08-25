import type { pack_registry, namespaced_id, map_command_factory } from '@/core';
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
} from '@/runtime';
import { tokenize_input, parse_vector, parse_integer } from './parser';
import { format_cli_help } from './help';

function resolve_namespaced_id
(
    registry: pack_registry,
    category: 'devices' | 'recipes' | 'commands',
    query:    string
): namespaced_id
{
    if (query.includes(':'))
    {
        const [pack, id] = query.split(':');
        const exists = Boolean(registry.packs.get(pack)?.[category]?.[id]);
        if (!exists)
        {
            throw new Error(`Item "${query}" not found in pack "${pack}".`);
        }
        return { pack, id };
    }

    const matches: namespaced_id[] = [];
    for (const [pack_name, mod] of registry.packs)
    {
        if (mod[category] && mod[category]![query])
        {
            matches.push({ pack: pack_name, id: query });
        }
    }

    if (matches.length === 1)
    {
        return matches[0];
    }
    if (matches.length > 1)
    {
        throw new Error(`Ambiguous ${category} "${query}". Matches: ${matches.map(m => `${m.pack}:${m.id}`).join(', ')}`);
    }

    throw new Error(`${category.slice(0, -1)} "${query}" not found in any loaded pack.`);
}

function find_command_factory
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
                const meta_alias = (cmd_factory as any)?.other_info?.cli?.alias;
                if (matches_alias(meta_alias, id))
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
 * Parses and executes a command string with pure positional & whitespace-separated vector syntax.
 */
export function execute_command(input: string): string
{
    const trimmed = input.trim();
    if (trimmed === '')
    {
        return '';
    }

    const tokens = tokenize_input(trimmed);
    const cmd    = tokens[0].toLowerCase();
    const args   = tokens.slice(1);

    const registry = get_registry();
    if (!registry)
    {
        return 'Error: Global pack registry not found.';
    }

    try
    {
        // ── 1. General & Navigation Builtins ─────────────────────────────────
        if (cmd === 'help')
        {
            return format_cli_help(registry);
        }

        if (cmd === 'history')
        {
            const tree = get_history_tree();
            if (!tree)
            {
                return 'History tree not initialized.';
            }
            return `History: ${tree.nodes.size} nodes. Current active node: #${tree.current_uid}.`;
        }

        if (cmd === 'undo')
        {
            const ok = undo();
            return ok ? 'Undo: reverted 1 step.' : 'Undo: already at the root of history.';
        }

        if (cmd === 'redo')
        {
            const ok = redo();
            return ok ? 'Redo: stepped forward 1 step.' : 'Redo: already at the latest state.';
        }

        if (cmd === 'jump')
        {
            if (args.length === 0)
            {
                throw new Error('Usage: jump <node_uid>');
            }
            const node_uid = parse_integer(args[0], 'History node UID');
            const ok = jump_to_history(node_uid);
            return ok ? `Jumped to history node #${node_uid}.` : `Failed to jump: node #${node_uid} not found in history tree.`;
        }

        if (cmd === 'prev-fork' || cmd === 'prev_fork')
        {
            const ok = jump_to_prev_fork();
            return ok ? 'Jumped to previous fork.' : 'No previous fork found in history ancestry.';
        }

        if (cmd === 'next-fork' || cmd === 'next_fork')
        {
            const ok = jump_to_next_fork();
            return ok ? 'Jumped to next fork.' : 'No forward fork found along this branch.';
        }

        if (cmd === 'jump-root' || cmd === 'jump_root')
        {
            const ok = jump_to_root();
            return ok ? 'Jumped to history root (UID 0).' : 'Already at root.';
        }

        if (cmd === 'jump-leaf' || cmd === 'jump_leaf')
        {
            const ok = jump_to_leaf();
            return ok ? 'Jumped to branch leaf node.' : 'Already at leaf.';
        }

        if (cmd === 'delete-node' || cmd === 'delete_node')
        {
            if (args.length === 0)
            {
                throw new Error('Usage: delete-node <node_uid>');
            }
            const node_uid = parse_integer(args[0], 'History node UID');
            const ok = delete_history_node(node_uid);
            return ok ? `Deleted history node #${node_uid}.` : `Failed to delete node #${node_uid}.`;
        }

        // ── 2. Standard Map Mutation Adapters ────────────────────────────────
        if (cmd === 'create' || cmd === 'create_device' || cmd === 'core:create_device')
        {
            if (args.length < 2)
            {
                throw new Error('Usage: create <device_id> <x> <y> [z...]');
            }
            const device_id_raw = args[0];
            const ns_id = resolve_namespaced_id(registry, 'devices', device_id_raw);
            const dev_class = registry.packs.get(ns_id.pack)?.devices?.[ns_id.id];
            if (!dev_class)
            {
                throw new Error(`Device constructor "${ns_id.pack}:${ns_id.id}" not found.`);
            }

            const dim = get_dimension() ?? get_map()?.dimension ?? 3;
            const pos = parse_vector(args.slice(1), dim);

            if (pos.some(c => c % 2 !== 0))
            {
                throw new Error(`Invalid device position (${pos.join(', ')}): all coordinates must be even integers (2k).`);
            }

            const factory = registry.packs.get('core')?.commands?.create_device;
            if (!factory)
            {
                throw new Error('Core command "create_device" not found.');
            }

            const cmd_obj = factory(dev_class, ns_id, pos);
            api_execute_command(cmd_obj);
            return `Created device "${ns_id.pack}:${ns_id.id}" at (${pos.join(', ')}).`;
        }

        if (cmd === 'move' || cmd === 'move_device' || cmd === 'core:move_device')
        {
            if (args.length < 2)
            {
                throw new Error('Usage: move <device_uid> <x> <y> [z...]');
            }
            const uid = parse_integer(args[0], 'Device UID');
            const map = get_map();
            if (map && !map.devices.some(d => d.uid === uid))
            {
                throw new Error(`Device #${uid} not found on map.`);
            }

            const dim = get_dimension() ?? map?.dimension ?? 3;
            const pos = parse_vector(args.slice(1), dim);

            if (pos.some(c => c % 2 !== 0))
            {
                throw new Error(`Invalid device position (${pos.join(', ')}): all coordinates must be even integers (2k).`);
            }

            const factory = registry.packs.get('core')?.commands?.move_device;
            if (!factory)
            {
                throw new Error('Core command "move_device" not found.');
            }

            const cmd_obj = factory(uid, pos);
            api_execute_command(cmd_obj);
            return `Moved device #${uid} to (${pos.join(', ')}).`;
        }

        if (cmd === 'delete' || cmd === 'delete_device' || cmd === 'core:delete_device')
        {
            if (args.length === 0)
            {
                throw new Error('Usage: delete <device_uid>');
            }
            const uid = parse_integer(args[0], 'Device UID');
            const map = get_map();
            if (map && !map.devices.some(d => d.uid === uid))
            {
                throw new Error(`Device #${uid} not found on map.`);
            }

            const factory = registry.packs.get('core')?.commands?.delete_device;
            if (!factory)
            {
                throw new Error('Core command "delete_device" not found.');
            }

            const cmd_obj = factory(uid);
            api_execute_command(cmd_obj);
            return `Deleted device #${uid}.`;
        }

        if (cmd === 'recipe' || cmd === 'select_recipe' || cmd === 'core:select_recipe')
        {
            if (args.length === 0)
            {
                throw new Error('Usage: recipe <device_uid> [recipe_id]');
            }
            const uid = parse_integer(args[0], 'Device UID');
            const map = get_map();
            if (map && !map.devices.some(d => d.uid === uid))
            {
                throw new Error(`Device #${uid} not found on map.`);
            }

            const factory = registry.packs.get('core')?.commands?.select_recipe;
            if (!factory)
            {
                throw new Error('Core command "select_recipe" not found.');
            }

            if (args.length > 1 && args[1].trim() !== '')
            {
                const recipe_ns = resolve_namespaced_id(registry, 'recipes', args[1].trim());
                const cmd_obj = factory(uid, recipe_ns);
                api_execute_command(cmd_obj);
                return `Selected recipe "${recipe_ns.pack}:${recipe_ns.id}" for device #${uid}.`;
            }
            else
            {
                const cmd_obj = factory(uid, undefined);
                api_execute_command(cmd_obj);
                return `Cleared recipe for device #${uid}.`;
            }
        }

        // ── 3. Downstream Pack Adapters ──────────────────────────────────────
        if (cmd === 'rotate' || cmd === 'rotate_device' || cmd === 'layered_2d:rotate_device')
        {
            if (args.length === 0)
            {
                throw new Error('Usage: rotate <device_uid> [steps]');
            }
            const uid = parse_integer(args[0], 'Device UID');
            const steps = args.length > 1 ? parse_integer(args[1], 'Steps') : 1;
            const factory = registry.packs.get('layered_2d')?.commands?.rotate_device;
            if (!factory)
            {
                throw new Error('Command "layered_2d:rotate_device" not found.');
            }
            const cmd_obj = factory(uid, steps);
            api_execute_command(cmd_obj);
            return `Rotated device #${uid} by ${steps} step(s).`;
        }

        if (cmd === 'flip' || cmd === 'flip_device' || cmd === 'layered_2d:flip_device')
        {
            if (args.length === 0)
            {
                throw new Error('Usage: flip <device_uid>');
            }
            const uid = parse_integer(args[0], 'Device UID');
            const factory = registry.packs.get('layered_2d')?.commands?.flip_device;
            if (!factory)
            {
                throw new Error('Command "layered_2d:flip_device" not found.');
            }
            const cmd_obj = factory(uid);
            api_execute_command(cmd_obj);
            return `Flipped device #${uid}.`;
        }

        if (cmd === 'camera' || cmd === 'basic_renderer:camera')
        {
            const eq_arg = args.join(' ');
            const factory = registry.packs.get('basic_renderer')?.commands?.camera;
            if (!factory)
            {
                throw new Error('Command "basic_renderer:camera" not found.');
            }
            const cmd_obj = factory(eq_arg);
            api_execute_command(cmd_obj);
            return `Camera updated (${eq_arg || 'default'}).`;
        }

        if (cmd === 'info' || cmd === 'info_device' || cmd === 'vanilla:info_device')
        {
            if (args.length === 0)
            {
                throw new Error('Usage: info <device_uid>');
            }
            const uid = parse_integer(args[0], 'Device UID');
            const factory = registry.packs.get('vanilla')?.commands?.info_device;
            if (!factory)
            {
                throw new Error('Command "vanilla:info_device" not found.');
            }
            const cmd_obj = factory(uid);
            api_execute_command(cmd_obj);
            return (cmd_obj as any).result_text || `Device #${uid} information displayed.`;
        }

        if (cmd === 'delete-branch' || cmd === 'delete_branch' || cmd === 'vanilla:delete_branch')
        {
            if (args.length === 0)
            {
                throw new Error('Usage: delete-branch <node_uid>');
            }
            const uid = parse_integer(args[0], 'Node UID');
            const factory = registry.packs.get('vanilla')?.commands?.delete_branch;
            if (!factory)
            {
                throw new Error('Command "vanilla:delete_branch" not found.');
            }
            const cmd_obj = factory(uid);
            api_execute_command(cmd_obj);
            return `Deleted history branch rooted at #${uid}.`;
        }

        if (cmd === 'pin' || cmd === 'pin_node' || cmd === 'vanilla:pin_node')
        {
            if (args.length === 0)
            {
                throw new Error('Usage: pin <node_uid>');
            }
            const uid = parse_integer(args[0], 'Node UID');
            const factory = registry.packs.get('vanilla')?.commands?.pin_node;
            if (!factory)
            {
                throw new Error('Command "vanilla:pin_node" not found.');
            }
            const cmd_obj = factory(uid);
            api_execute_command(cmd_obj);
            return `Toggled pin state for history node #${uid}.`;
        }

        // ── 4. Dynamic Generic Command Dispatch ──────────────────────────────
        const matched = find_command_factory(registry, cmd);
        if (!matched)
        {
            return `Unknown command: "${cmd}". Type "help" to list available commands.`;
        }

        const cmd_obj = matched.factory(...args);
        api_execute_command(cmd_obj);
        if ((cmd_obj as any).result_text)
        {
            return (cmd_obj as any).result_text;
        }
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
