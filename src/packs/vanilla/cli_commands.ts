import type { history_node } from '@/core';
import { compute_path_to_root } from '@/core';
import
{
    get_map,
    get_history_tree,
    get_registry,
    execute_command as api_execute_command,
    undo as api_undo,
    redo as api_redo,
    jump_to_history,
    jump_to_prev_fork,
    jump_to_next_fork,
    delete_history_node
} from '@/runtime';
import { register_cli_command, clean_flag_arg } from '@/packs/cli_tool';
import { format_namespaced_id, parse_namespaced_id } from './identifier';
import { get_device_class, get_command } from './registry_query';
import { delete_branch } from './history';
import { toggle_node_pin, get_pinned_nodes } from './history';

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
        const label = node.command ? format_namespaced_id(node.command) : 'root (initial)';
        const parent_info = node.parent_uid !== null ? ` (parent: ${node.parent_uid})` : '';
        const branches = node.children_uids.length > 1 ? ` [branches: ${node.children_uids.join(', ')}]` : '';
        lines.push(`${prefix}[#${node.uid}] ${label}${parent_info}${branches}`);
    }

    return lines.join('\n');
}

export function register_vanilla_cli_commands(): void
{
    // Create
    register_cli_command({
        name:        'create',
        usage:       'create --"<def_id>" --"<position>"',
        description: 'Create a device at the specified position.',
        execute(args)
        {
            const map = get_map();
            if (!map) return 'Error: Global map instance not found.';
            const n_dim = map.dimension;
            if (args.length < 2)
            {
                return 'Usage: create --"<def_id>" --"<position>" (e.g. create --"test:assembler" --"4, 4, 0")';
            }
            const def_id = clean_flag_arg(args[0]);
            const pos_str = clean_flag_arg(args[1]);
            const coords = pos_str.split(',').map(s => Number(s.trim()));

            if (coords.length !== n_dim || coords.some(isNaN))
            {
                return `Error: Invalid position format. Expected ${n_dim} comma-separated numbers (e.g. "4, 4, 0").`;
            }

            if (coords.some(c => Math.abs(c) % 2 !== 0))
            {
                return 'Error: Invalid position. Position coordinates must all be even numbers (e.g. "4, 4, 0").';
            }

            try
            {
                const registry = get_registry();
                if (!registry) return 'Error: Global pack registry not found.';
                const ns_id = parse_namespaced_id(def_id);
                const dev_class = get_device_class(registry, ns_id);
                const create_factory = get_command(registry, { pack: 'core', id: 'create_device' });
                const cmd_obj = create_factory(dev_class, ns_id, coords);
                api_execute_command(cmd_obj);
                const created = map.devices[map.devices.length - 1];
                return `Created device ${def_id} (ID: ${created.uid}) at [${coords.join(', ')}]`;
            }
            catch (err: unknown)
            {
                return `Error: ${(err as Error).message}`;
            }
        }
    });

    // Move
    register_cli_command({
        name:        'move',
        usage:       'move --"<uid>" --"<pos>"',
        description: 'Move a device to a new position.',
        execute(args)
        {
            const map = get_map();
            if (!map) return 'Error: Global map instance not found.';
            const n_dim = map.dimension;
            if (args.length < 2)
            {
                return 'Usage: move --"<uid>" --"<pos>" (e.g. move --"1" --"6, 2, 0")';
            }
            const uid_str = clean_flag_arg(args[0]);
            const pos_str = clean_flag_arg(args[1]);
            const id = parseInt(uid_str, 10);
            const coords = pos_str.split(',').map(s => Number(s.trim()));

            if (isNaN(id) || coords.length !== n_dim || coords.some(isNaN))
            {
                return `Error: Invalid arguments. Usage: move --"<uid>" --"<pos>" (e.g. move --"1" --"6, 2, 0")`;
            }

            if (coords.some(c => Math.abs(c) % 2 !== 0))
            {
                return 'Error: Invalid position. Position coordinates must all be even numbers (e.g. "6, 2, 0").';
            }

            const existing = map.devices.find(d => d.uid === id);
            if (!existing)
            {
                return `Error: Device ID ${id} not found.`;
            }

            try
            {
                const registry = get_registry();
                if (!registry) return 'Error: Global pack registry not found.';
                const move_factory = get_command(registry, { pack: 'core', id: 'move_device' });
                const cmd_obj = move_factory(id, coords);
                api_execute_command(cmd_obj);
                return `Moved device ID ${id} to [${coords.join(', ')}]`;
            }
            catch (err: unknown)
            {
                return `Error: ${(err as Error).message}`;
            }
        }
    });

    // Delete
    register_cli_command({
        name:        'delete',
        usage:       'delete --"<uid>"',
        description: 'Delete a device from the map.',
        execute(args)
        {
            const map = get_map();
            if (!map) return 'Error: Global map instance not found.';
            if (args.length < 1)
            {
                return 'Usage: delete --"<uid>" (e.g. delete --"1")';
            }
            const uid_str = clean_flag_arg(args[0]);
            const id = parseInt(uid_str, 10);
            if (isNaN(id))
            {
                return 'Error: Invalid device UID. Must be a number (e.g. delete --"1").';
            }
            const existing = map.devices.find(d => d.uid === id);
            if (!existing)
            {
                return `Error: Device ID ${id} not found.`;
            }
            try
            {
                const registry = get_registry();
                if (!registry) return 'Error: Global pack registry not found.';
                const delete_factory = get_command(registry, { pack: 'core', id: 'delete_device' });
                const cmd_obj = delete_factory(id);
                api_execute_command(cmd_obj);
                return `Deleted device ID ${id}`;
            }
            catch (err: unknown)
            {
                return `Error: ${(err as Error).message}`;
            }
        }
    });

    // Undo
    register_cli_command({
        name:        'undo',
        usage:       'undo',
        description: 'Undo the previous mutation in history tree.',
        execute()
        {
            const success = api_undo();
            return success ? 'Undo successful.' : 'Nothing to undo (already at root).';
        }
    });

    // Redo
    register_cli_command({
        name:        'redo',
        usage:       'redo',
        description: 'Redo the next mutation along active branch.',
        execute()
        {
            const success = api_redo();
            return success ? 'Redo successful.' : 'Nothing to redo (at latest node in current branch).';
        }
    });

    // Prev Fork
    register_cli_command({
        name:        'prev-fork',
        usage:       'prev-fork',
        description: 'Jump back to the previous fork node.',
        execute()
        {
            const success = jump_to_prev_fork();
            return success ? 'Jumped to previous fork point.' : 'No previous fork found.';
        }
    });

    // Next Fork
    register_cli_command({
        name:        'next-fork',
        usage:       'next-fork',
        description: 'Jump forward to the next fork node.',
        execute()
        {
            const success = jump_to_next_fork();
            return success ? 'Jumped to next fork point.' : 'No downstream fork found.';
        }
    });

    // History
    register_cli_command({
        name:        'history',
        usage:       'history',
        description: 'Display history tree summary.',
        execute()
        {
            return format_history_summary();
        }
    });

    // Jump
    register_cli_command({
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

    // Delete Node
    register_cli_command({
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

    // Delete Branch
    register_cli_command({
        name:        'delete-branch',
        usage:       'delete-branch --"<node_uid>"',
        description: 'Delete an entire branch rooted at the specified node.',
        execute(args)
        {
            if (args.length < 1)
            {
                return 'Usage: delete-branch --"<node_uid>" (e.g. delete-branch --"2")';
            }
            const uid_str = clean_flag_arg(args[0]);
            const target_uid = parseInt(uid_str, 10);
            if (isNaN(target_uid))
            {
                return 'Error: Invalid node UID. Must be a number (e.g. delete-branch --"2").';
            }
            if (target_uid === 0)
            {
                return 'Error: Cannot delete root branch (#0).';
            }
            const tree = get_history_tree();
            if (tree)
            {
                const active_path = compute_path_to_root(tree, tree.current_uid);
                if (active_path.includes(target_uid))
                {
                    return `Error: Cannot delete branch containing active node (#${tree.current_uid}). Please switch active branch first.`;
                }
            }
            const success = delete_branch(target_uid);
            return success ? `Successfully deleted history branch rooted at #${target_uid}.` : `Error: Failed to delete history branch #${target_uid} (node not found).`;
        }
    });

    // Pin
    register_cli_command({
        name:        'pin',
        usage:       'pin --"<node_uid>|list"',
        description: 'Toggle pin on a history node or list pinned nodes.',
        execute(args)
        {
            if (args.length < 1)
            {
                return 'Usage: pin --"<node_uid>" or pin --"list" (e.g. pin --"2", pin --"list")';
            }
            const arg_str = clean_flag_arg(args[0]);
            if (arg_str.toLowerCase() === 'list')
            {
                const pinned = get_pinned_nodes().sort((a: number, b: number) => a - b);
                if (pinned.length === 0)
                {
                    return 'No nodes are currently pinned.';
                }
                const tree = get_history_tree();
                const lines = ['Pinned History Nodes:'];
                for (const uid of pinned)
                {
                    const node = tree?.nodes.get(uid);
                    const label = node ? (node.command ? format_namespaced_id(node.command) : 'root (initial state)') : 'unknown';
                    lines.push(`- [#${uid}] ${label}`);
                }
                return lines.join('\n');
            }

            const target_uid = parseInt(arg_str, 10);
            if (isNaN(target_uid))
            {
                return 'Error: Invalid node UID. Must be a number or "list" (e.g. pin --"2", pin --"list").';
            }
            const res = toggle_node_pin(target_uid);
            if (res === null)
            {
                return `Error: History node #${target_uid} not found.`;
            }
            return res
                ? `Node #${target_uid} is now pinned (highlighted).`
                : `Node #${target_uid} unpinned.`;
        }
    });
}
