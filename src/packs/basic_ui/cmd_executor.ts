import type { view_plane } from '@/packs/basic_renderer/types';
import { create_device, delete_device, move_device } from '@/API';
import { get_map } from '@/runtime';
import { basic_renderer } from '@/packs/basic_renderer';

import { clean_flag_arg, tokenize_input, parse_axis_name, get_axis_label, get_right_oriented_axes } from '@/packs/cmd_tool';

import { basic_ui } from './index';

function format_camera_equation(plane: view_plane): string
{
    const map = get_map();
    const num_dims = map ? map.size.length : Math.max(plane.slices.length, 3);
    const eq_parts: string[] = [];
    for (let i = 0; i < num_dims; i++)
    {
        if (i !== plane.dim_h && i !== plane.dim_v)
        {
            const axis_name = get_axis_label(i);
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
            return 'Available commands: create --"<def_id>" --"<position>", move --"<uid>" --"<pos>", delete --"<uid>", info --"<uid>", camera --"<axis>=<depth>", help';
        }

        case 'info':
        case 'get':
        case 'inspect':
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
            if (!success)
            {
                return `Error: Device ID ${id} not found.`;
            }
            return `Displayed info for device UID ${id}`;
        }

        case 'camera':
        {
            const current = basic_renderer.get_camera();
            if (args.length === 0)
            {
                return format_camera_equation(current);
            }

            const raw = args.join(' ');
            const clean = clean_flag_arg(raw);

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
                return 'Error: Invalid camera format. Usage: camera --"d3=0" or camera --"d1=1, d3=0"';
            }

            const num_dims = map.size.length;
            const fixed_axes_set = new Set(fixed_map.keys());
            const free_dim_count = num_dims - fixed_axes_set.size;

            if (free_dim_count !== 2)
            {
                return `Error: Camera requires exactly 2 free dimensions to form a 2D view plane (currently ${free_dim_count} free dimensions). Expected ${num_dims - 2} fixed axes for a ${num_dims}D map.`;
            }

            const axes = get_right_oriented_axes(num_dims, fixed_axes_set);
            if (!axes)
            {
                return `Error: Unable to resolve 2D view plane. Free dimensions count must equal 2.`;
            }

            const new_slices = [...current.slices];
            while (new_slices.length < num_dims)
            {
                new_slices.push(0);
            }

            fixed_map.forEach((depth, axis_idx) =>
            {
                if (axis_idx < num_dims)
                {
                    new_slices[axis_idx] = depth;
                }
            });

            basic_renderer.set_camera(axes.dim_h, axes.dim_v, new_slices);

            const updated = basic_renderer.get_camera();
            return format_camera_equation(updated);
        }

        case 'create':
        case 'add':
        {
            const n_dim = map.size.length;
            if (args.length < 2)
            {
                return `Usage: create --"<def_id>" --"<position>" (e.g. create --"test:assembler" --"4, 4, 0")`;
            }
            const def_id = clean_flag_arg(args[0]);
            const pos_str = clean_flag_arg(args[1]);

            const coords = pos_str.split(/[\s,]+/).filter(s => s !== '').map(s => parseInt(s, 10));

            if (coords.length !== n_dim || coords.some(c => isNaN(c)))
            {
                return `Error: Invalid position format. Expected ${n_dim} numbers (e.g. create --"${def_id}" --"4, 4, 0").`;
            }

            if (coords.some(c => Math.abs(c) % 2 !== 0))
            {
                return `Error: Invalid position. Position coordinates must all be even numbers (e.g. "4, 4, 0").`;
            }

            const dev = create_device(map, def_id, coords, []);
            return `Created device ${dev.definition_id} (ID: ${dev.uid}) at [${coords.join(', ')}]`;
        }

        case 'delete':
        case 'del':
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
            delete_device(map, id);
            return `Deleted device ID ${id}`;
        }

        case 'move':
        {
            const n_dim = map.size.length;
            if (args.length < 2)
            {
                return `Usage: move --"<uid>" --"<pos>" (e.g. move --"1" --"6, 2, 0")`;
            }
            const uid_str = clean_flag_arg(args[0]);
            const pos_str = clean_flag_arg(args[1]);

            const id = parseInt(uid_str, 10);
            const coords = pos_str.split(/[\s,]+/).filter(s => s !== '').map(s => parseInt(s, 10));

            if (isNaN(id) || coords.length !== n_dim || coords.some(c => isNaN(c)))
            {
                return `Error: Invalid arguments. Usage: move --"<uid>" --"<pos>" (e.g. move --"1" --"6, 2, 0")`;
            }

            if (coords.some(c => Math.abs(c) % 2 !== 0))
            {
                return `Error: Invalid position. Position coordinates must all be even numbers (e.g. "6, 2, 0").`;
            }

            const existing = map.devices.find(d => d.uid === id);
            if (!existing)
            {
                return `Error: Device ID ${id} not found.`;
            }
            move_device(map, id, coords);
            return `Moved device ID ${id} to [${coords.join(', ')}]`;
        }

        case 'rotate':
        {
            // TODO: rotate functionality to be redesigned.
            return 'TODO: rotate command is currently disabled.';
        }

        default:
        {
            return `Unknown command: "${cmd}". Type "help" for a list of available commands.`;
        }
    }
}


