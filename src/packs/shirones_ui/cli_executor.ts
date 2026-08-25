import type { view_plane } from '@/packs/basic_renderer/types';
import
{
    create_device_command,
    delete_device_command,
    move_device_command,
    execute_command as api_execute_command,
    undo as api_undo,
    redo as api_redo,
    jump_to_history,
    jump_to_prev_fork,
    jump_to_next_fork,
    delete_node as api_delete_node,
    compute_path_to_root,
    get_history_tree,
    format_namespaced_id
} from '@/API';
import { get_map } from '@/runtime';
import { basic_renderer } from '@/packs/basic_renderer';
import { clean_flag_arg, tokenize_input, parse_axis_name, get_axis_label, get_right_oriented_axes } from '@/packs/cli_tool';
import { basic_ui } from '@/packs/basic_ui';
import { delete_branch, toggle_node_pin, get_pinned_nodes } from '@/packs/vanilla';

function format_camera_equation(plane: view_plane): string
{
    const map = get_map();
    const num_dims = map ? map.dimension : plane.slices.length;
    const eq_parts: string[] = [];
    for (let i = 0; i < num_dims; i++)
    {
        if (i !== plane.dim_h && i !== plane.dim_v)
        {
            const axis_name = get_axis_label(i);
            const depth = plane.slices[i];
            eq_parts.push(`${axis_name}=${depth}`);
        }
    }
    const eq_str = eq_parts.join(', ');
    return `camera --"${eq_str}"`;
}

/**
 * Formats a summary of the current branch in the history tree.
 */
function format_history_summary(): string
{
    const tree = get_history_tree();
    if (!tree)
    {
        return 'History tree not initialized.';
    }

    const lines: string[] = [`History Tree (Current UID: ${tree.current_uid}, Total Nodes: ${tree.nodes.size}):`];
    const sorted_nodes = Array.from(tree.nodes.values()).sort((a, b) => a.uid - b.uid);
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

/**
 * Parses and executes a command string, returning a result message.
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

    const map = get_map();
    if (!map)
    {
        return 'Error: Global map instance not found.';
    }

    switch (cmd)
    {
        case 'help':
        {
            return 'Available commands: create --"<def_id>" --"<position>", move --"<uid>" --"<pos>", delete --"<uid>", info --"<uid>", camera --"<axis>=<depth>", undo, redo, prev-fork, next-fork, history, jump --"<node_uid>", delete-node --"<node_uid>", delete-branch --"<node_uid>", pin --"<node_uid>|list", help';
        }

        case 'pin':
        {
            if (args.length < 1)
            {
                return 'Usage: pin --"<node_uid>" or pin --"list" (e.g. pin --"2", pin --"list")';
            }
            const arg_str = clean_flag_arg(args[0]);
            if (arg_str.toLowerCase() === 'list')
            {
                const pinned = get_pinned_nodes().sort((a, b) => a - b);
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

        case 'delete-node':
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
            const success = api_delete_node(target_uid);
            return success ? `Successfully deleted history node #${target_uid}.` : `Error: Failed to delete history node #${target_uid} (node not found).`;
        }

        case 'delete-branch':
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

        case 'undo':
        {
            const success = api_undo();
            return success ? 'Undo successful.' : 'Nothing to undo (already at root).';
        }

        case 'redo':
        {
            const success = api_redo();
            return success ? 'Redo successful.' : 'Nothing to redo (at latest node in current branch).';
        }

        case 'prev-fork':
        {
            const success = jump_to_prev_fork();
            return success ? 'Jumped to previous fork point.' : 'No previous fork found.';
        }

        case 'next-fork':
        {
            const success = jump_to_next_fork();
            return success ? 'Jumped to next fork point.' : 'No downstream fork found.';
        }

        case 'history':
        {
            return format_history_summary();
        }

        case 'jump':
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

        case 'info':
        {
            if (args.length < 1)
            {
                return 'Usage: info --"<uid>" (e.g. info --"1")';
            }
            const uid_str = clean_flag_arg(args[0]);
            const id = parseInt(uid_str, 10);
            if (isNaN(id))
            {
                return 'Error: Invalid device UID. Must be a number (e.g. info --"1").';
            }
            const success = basic_ui.display_device_info(id);
            return success ? `Displayed info for device UID ${id}` : `Error: Device ID ${id} not found.`;
        }

        case 'camera':
        {
            const current = basic_renderer.get_camera();
            if (args.length === 0)
            {
                return format_camera_equation(current);
            }

            const clean = clean_flag_arg(args.join(' '));
            const fixed_map = new Map<number, number>();
            const parts = clean.split(',').map(s => s.trim()).filter(s => s.length > 0);

            for (const part of parts)
            {
                const kv = part.split('=');
                if (kv.length === 2)
                {
                    const axis_idx = parse_axis_name(kv[0]);
                    const depth_val = parseInt(kv[1].trim(), 10);
                    if (axis_idx !== null && !isNaN(depth_val))
                    {
                        fixed_map.set(axis_idx, depth_val);
                    }
                }
            }

            if (fixed_map.size === 0)
            {
                return 'Error: Invalid camera format. Usage: camera --"d3=0"';
            }

            const num_dims = map.dimension;
            const fixed_axes_set = new Set(fixed_map.keys());
            const free_dim_count = num_dims - fixed_axes_set.size;

            if (free_dim_count !== 2)
            {
                return `Error: Camera requires exactly 2 free dimensions (currently ${free_dim_count}). Expected ${num_dims - 2} fixed axes.`;
            }

            const axes = get_right_oriented_axes(num_dims, fixed_axes_set);
            if (!axes)
            {
                return 'Error: Unable to resolve 2D view plane.';
            }

            const new_slices = [...current.slices];
            fixed_map.forEach((depth, axis_idx) =>
            {
                if (axis_idx < num_dims)
                {
                    new_slices[axis_idx] = depth;
                }
            });

            basic_renderer.set_camera(axes.dim_h, axes.dim_v, new_slices);
            return format_camera_equation(basic_renderer.get_camera());
        }

        case 'create':
        {
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
                const cmd_obj = create_device_command(def_id, coords);
                api_execute_command(cmd_obj);
                const created = map.devices[map.devices.length - 1];
                return `Created device ${def_id} (ID: ${created.uid}) at [${coords.join(', ')}]`;
            }
            catch (err: unknown)
            {
                return `Error: ${(err as Error).message}`;
            }
        }

        case 'delete':
        {
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
            const cmd_obj = delete_device_command(id);
            api_execute_command(cmd_obj);
            return `Deleted device ID ${id}`;
        }

        case 'move':
        {
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
            const cmd_obj = move_device_command(id, coords);
            api_execute_command(cmd_obj);
            return `Moved device ID ${id} to [${coords.join(', ')}]`;
        }

        default:
        {
            return `Unknown command: "${cmd}". Type "help" for a list of available commands.`;
        }
    }
}
