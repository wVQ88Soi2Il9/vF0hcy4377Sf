import type { game_map, pack_registry, history_node } from '@/core';
import { compute_path_to_root } from '@/core';
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
import
{
    format_namespaced_id,
    parse_namespaced_id,
    get_device_class,
    has_command,
    get_command,
    delete_branch,
    toggle_node_pin,
    get_pinned_nodes
} from '@/packs/vanilla';
import { basic_renderer, type view_plane } from '@/packs/basic_renderer';
import { clean_flag_arg, parse_axis_name, get_axis_label, get_right_oriented_axes } from '@/packs/cli_tool';
import { basic_ui } from '@/packs/basic_ui';

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

function format_camera_equation(plane: view_plane, map: game_map): string
{
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

export const CLI_COMMAND_REGISTRY = new Map<string, cli_command_spec>();

function register_cli_command(spec: cli_command_spec): void
{
    CLI_COMMAND_REGISTRY.set(spec.name.toLowerCase(), spec);
}

// ── 1. Create Device ───────────────────────────────────────────────────────────
register_cli_command({
    name:        'create',
    usage:       'create --"<def_id>" --"<position>"',
    description: 'Create a device at the specified position.',
    execute(args, { map, registry })
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

// ── 2. Move Device ─────────────────────────────────────────────────────────────
register_cli_command({
    name:        'move',
    usage:       'move --"<uid>" --"<pos>"',
    description: 'Move a device to a new position.',
    execute(args, { map, registry })
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

        try
        {
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

// ── 3. Delete Device ───────────────────────────────────────────────────────────
register_cli_command({
    name:        'delete',
    usage:       'delete --"<uid>"',
    description: 'Delete a device from the map.',
    execute(args, { map, registry })
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
        try
        {
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

// ── 4. Rotate Device ───────────────────────────────────────────────────────────
register_cli_command({
    name:        'rotate',
    usage:       'rotate --"<uid>" [--"<steps>"]',
    description: 'Rotate a 2.5D device counter-clockwise by steps (default: 1).',
    execute(args, { map, registry })
    {
        if (args.length < 1)
        {
            return 'Usage: rotate --"<uid>" [optional: --"<steps>"] (e.g. rotate --"1", rotate --"1" --"2")';
        }
        const uid_str = clean_flag_arg(args[0]);
        const id = parseInt(uid_str, 10);
        const steps = args.length >= 2 ? parseInt(clean_flag_arg(args[1]), 10) : 1;

        if (isNaN(id) || isNaN(steps))
        {
            return 'Error: Invalid arguments. Usage: rotate --"<uid>" [optional: --"<steps>"]';
        }

        const existing = map.devices.find(d => d.uid === id);
        if (!existing)
        {
            return `Error: Device ID ${id} not found.`;
        }

        try
        {
            if (!has_command(registry, { pack: 'layered_2d', id: 'rotate_device' }))
            {
                return 'Error: Rotate command is not supported by the current registry.';
            }
            const rotate_factory = get_command(registry, { pack: 'layered_2d', id: 'rotate_device' });
            const cmd_obj = rotate_factory(id, steps);
            api_execute_command(cmd_obj);
            return `Rotated device ID ${id} by ${steps} step(s)`;
        }
        catch (err: unknown)
        {
            return `Error: ${(err as Error).message}`;
        }
    }
});

// ── 5. Flip Device ─────────────────────────────────────────────────────────────
register_cli_command({
    name:        'flip',
    usage:       'flip --"<uid>"',
    description: 'Toggle vertical flip on a 2.5D device.',
    execute(args, { map, registry })
    {
        if (args.length < 1)
        {
            return 'Usage: flip --"<uid>" (e.g. flip --"1")';
        }
        const uid_str = clean_flag_arg(args[0]);
        const id = parseInt(uid_str, 10);

        if (isNaN(id))
        {
            return 'Error: Invalid device UID. Must be a number (e.g. flip --"1").';
        }

        const existing = map.devices.find(d => d.uid === id);
        if (!existing)
        {
            return `Error: Device ID ${id} not found.`;
        }

        try
        {
            if (!has_command(registry, { pack: 'layered_2d', id: 'flip_device' }))
            {
                return 'Error: Flip command is not supported by the current registry.';
            }
            const flip_factory = get_command(registry, { pack: 'layered_2d', id: 'flip_device' });
            const cmd_obj = flip_factory(id);
            api_execute_command(cmd_obj);
            return `Flipped device ID ${id}`;
        }
        catch (err: unknown)
        {
            return `Error: ${(err as Error).message}`;
        }
    }
});

// ── 6. Info ───────────────────────────────────────────────────────────────────
register_cli_command({
    name:        'info',
    usage:       'info --"<uid>"',
    description: 'Inspect device information.',
    execute(args)
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
});

// ── 7. Camera ─────────────────────────────────────────────────────────────────
register_cli_command({
    name:        'camera',
    usage:       'camera --"<axis>=<depth>"',
    description: 'Get or set camera 2D view plane equation.',
    execute(args, { map })
    {
        const current = basic_renderer.get_camera();
        if (args.length === 0)
        {
            return format_camera_equation(current, map);
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
        return format_camera_equation(basic_renderer.get_camera(), map);
    }
});

// ── 8. Undo ───────────────────────────────────────────────────────────────────
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

// ── 9. Redo ───────────────────────────────────────────────────────────────────
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

// ── 10. Prev Fork ─────────────────────────────────────────────────────────────
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

// ── 11. Next Fork ─────────────────────────────────────────────────────────────
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

// ── 12. History ───────────────────────────────────────────────────────────────
register_cli_command({
    name:        'history',
    usage:       'history',
    description: 'Display history tree summary.',
    execute()
    {
        return format_history_summary();
    }
});

// ── 13. Jump ──────────────────────────────────────────────────────────────────
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

// ── 14. Delete Node ───────────────────────────────────────────────────────────
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

// ── 15. Delete Branch ─────────────────────────────────────────────────────────
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

// ── 16. Pin ───────────────────────────────────────────────────────────────────
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
});

export function format_cli_help(): string
{
    const specs = Array.from(CLI_COMMAND_REGISTRY.values());
    const usages = specs.map(s => s.usage);
    return `Available commands: ${usages.join(', ')}, help`;
}
