import type { rotation_plane } from '@/core/types';
import type { view_plane } from '@/packs/basic_renderer/types';
import { create_device, delete_device, move_device, rotate_device } from '@/API';
import { get_map } from '@/runtime';
import { get_camera_plane, set_camera_plane } from '@/packs/basic_renderer';

function parse_axis_name(name: string): number | null
{
    const lower = name.trim().toLowerCase();
    if (lower === 'x')
    {
        return 0;
    }
    if (lower === 'y')
    {
        return 1;
    }
    if (lower === 'z')
    {
        return 2;
    }
    if (lower === 'w')
    {
        return 3;
    }
    if (lower.startsWith('d'))
    {
        const idx = parseInt(lower.substring(1), 10);
        if (!isNaN(idx) && idx >= 0)
        {
            return idx;
        }
    }
    const direct = parseInt(lower, 10);
    if (!isNaN(direct) && direct >= 0)
    {
        return direct;
    }
    return null;
}

function get_axis_label(idx: number): string
{
    const labels = ['X', 'Y', 'Z', 'W'];
    return labels[idx] ?? `D${idx}`;
}

function format_camera_equation(plane: view_plane): string
{
    const eq_parts: string[] = [];
    const num_dims = Math.max(plane.slices.length, 3);
    for (let i = 0; i < num_dims; i++)
    {
        if (i !== plane.dim_h && i !== plane.dim_v)
        {
            const axis_name = get_axis_label(i).toLowerCase();
            const depth = plane.slices[i] ?? 0;
            eq_parts.push(`${axis_name}=${depth}`);
        }
    }
    const eq_str = eq_parts.length > 0 ? eq_parts.join(', ') : '';
    return `camera --"${eq_str}"`;
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

    const tokens = trimmed.split(/\s+/);
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
            return 'Available commands: create <def_id> <x> <y> <z>, move <id> <x> <y> <z>, delete <id>, rotate <id> <a_a> <a_b> <steps>, camera --"<axis>=<depth>", help';
        }

        case 'camera':
        {
            const current = get_camera_plane();
            if (args.length === 0)
            {
                return format_camera_equation(current);
            }

            const raw = args.join(' ');
            const clean = raw.replace(/^--/, '').replace(/^"/, '').replace(/"$/, '').trim();

            const fixed_map = new Map<number, number>();
            const parts = clean.split(',');

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
                return 'Error: Invalid camera format. Usage: camera --"z=0" or camera --"x=1, z=0"';
            }

            const num_dims = Math.max(map.size.length, 3);
            const new_slices = [...current.slices];
            while (new_slices.length < num_dims)
            {
                new_slices.push(0);
            }

            fixed_map.forEach((depth, axis_idx) =>
            {
                if (axis_idx < new_slices.length)
                {
                    new_slices[axis_idx] = depth;
                }
            });

            const all_axes = Array.from({ length: num_dims }, (_, i) => i);
            const remaining_axes = all_axes.filter(a => !fixed_map.has(a));

            let dim_h = current.dim_h;
            let dim_v = current.dim_v;

            if (remaining_axes.length >= 2)
            {
                dim_h = remaining_axes[0];
                dim_v = remaining_axes[1];
            }
            else if (remaining_axes.length === 1)
            {
                dim_h = remaining_axes[0];
                if (dim_v === dim_h)
                {
                    dim_v = (dim_h + 1) % num_dims;
                }
            }

            set_camera_plane(dim_h, dim_v, new_slices);

            const updated = get_camera_plane();
            return format_camera_equation(updated);
        }

        case 'create':
        case 'add':
        {
            if (args.length < 4)
            {
                return 'Usage: create <def_id> <x> <y> <z> (e.g. create test:assembler 4 4 0)';
            }
            const def_id = args[0];
            const x      = parseInt(args[1], 10);
            const y      = parseInt(args[2], 10);
            const z      = parseInt(args[3], 10);

            if (isNaN(x) || isNaN(y) || isNaN(z))
            {
                return 'Error: Invalid coordinates. x, y, z must be numbers.';
            }

            const dev = create_device(map, def_id, [x, y, z], []);
            return `Created device ${dev.definition_id} (ID: ${dev.unique_id}) at [${x}, ${y}, ${z}]`;
        }

        case 'delete':
        case 'del':
        {
            if (args.length < 1)
            {
                return 'Usage: delete <device_id>';
            }
            const id = parseInt(args[0], 10);
            if (isNaN(id))
            {
                return 'Error: Invalid device_id. Must be a number.';
            }
            const existing = map.devices.find(d => d.unique_id === id);
            if (!existing)
            {
                return `Error: Device ID ${id} not found.`;
            }
            delete_device(map, id);
            return `Deleted device ID ${id}`;
        }

        case 'move':
        {
            if (args.length < 4)
            {
                return 'Usage: move <device_id> <x> <y> <z>';
            }
            const id = parseInt(args[0], 10);
            const x  = parseInt(args[1], 10);
            const y  = parseInt(args[2], 10);
            const z  = parseInt(args[3], 10);

            if (isNaN(id) || isNaN(x) || isNaN(y) || isNaN(z))
            {
                return 'Error: Invalid arguments. ID and coordinates must be numbers.';
            }
            const existing = map.devices.find(d => d.unique_id === id);
            if (!existing)
            {
                return `Error: Device ID ${id} not found.`;
            }
            move_device(map, id, [x, y, z]);
            return `Moved device ID ${id} to [${x}, ${y}, ${z}]`;
        }

        case 'rotate':
        {
            if (args.length < 4)
            {
                return 'Usage: rotate <device_id> <axis_a> <axis_b> <steps> (e.g. rotate 0 0 1 1)';
            }
            const id     = parseInt(args[0], 10);
            const axis_a = parseInt(args[1], 10);
            const axis_b = parseInt(args[2], 10);
            const raw_s  = parseInt(args[3], 10);

            if (isNaN(id) || isNaN(axis_a) || isNaN(axis_b) || isNaN(raw_s))
            {
                return 'Error: Invalid arguments. ID, axis_a, axis_b, and steps must be numbers.';
            }
            const existing = map.devices.find(d => d.unique_id === id);
            if (!existing)
            {
                return `Error: Device ID ${id} not found.`;
            }
            const steps = ((raw_s % 4 + 4) % 4) as 0 | 1 | 2 | 3;
            const rot_plane: rotation_plane = { axis_a, axis_b, steps };
            rotate_device(map, id, [rot_plane]);
            return `Rotated device ID ${id} in plane (${axis_a}, ${axis_b}) by ${steps * 90}°`;
        }

        default:
        {
            return `Unknown command: "${cmd}". Type "help" for a list of available commands.`;
        }
    }
}


