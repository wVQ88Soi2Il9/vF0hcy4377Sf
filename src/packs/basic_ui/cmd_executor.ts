import type { view_plane } from '@/packs/basic_renderer/types';
import { create_device, delete_device, move_device } from '@/API';
import { get_map } from '@/runtime';
import { get_camera_plane, set_camera_plane } from '@/packs/basic_renderer';

/**
 * Strips leading '--' and outer double quotes from flag arguments.
 * Supports: --"value", --"key=value", --key="value", --"val1, val2"
 */
function clean_flag_arg(arg: string): string
{
    let clean = arg.trim();
    if (clean.startsWith('--'))
    {
        clean = clean.substring(2);
    }
    if (clean.startsWith('"') && clean.endsWith('"') && clean.length >= 2)
    {
        clean = clean.substring(1, clean.length - 1);
    }
    const eq_idx = clean.indexOf('=');
    if (eq_idx !== -1)
    {
        clean = clean.substring(eq_idx + 1);
        if (clean.startsWith('"') && clean.endsWith('"') && clean.length >= 2)
        {
            clean = clean.substring(1, clean.length - 1);
        }
    }
    return clean.trim();
}

/**
 * Tokenizes command input while respecting quoted strings.
 */
function tokenize_input(input: string): string[]
{
    const tokens: string[] = [];
    let current = '';
    let in_quotes = false;

    for (let i = 0; i < input.length; i++)
    {
        const char = input[i];
        if (char === '"')
        {
            in_quotes = !in_quotes;
            current += char;
        }
        else if (/\s/.test(char) && !in_quotes)
        {
            if (current.length > 0)
            {
                tokens.push(current);
                current = '';
            }
        }
        else
        {
            current += char;
        }
    }
    if (current.length > 0)
    {
        tokens.push(current);
    }
    return tokens;
}

/**
 * Translation Layer: Human (1-indexed) → Internal Code (0-indexed).
 *
 * Input examples:
 *   "x" / "1" / "d1" → 0
 *   "y" / "2" / "d2" → 1
 *   "z" / "3" / "d3" → 2
 *   "w" / "4" / "d4" → 3
 *   "5" / "d5"       → 4
 */
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
        const human_idx = parseInt(lower.substring(1), 10);
        if (!isNaN(human_idx) && human_idx >= 1)
        {
            return human_idx - 1;
        }
    }
    const direct_human_idx = parseInt(lower, 10);
    if (!isNaN(direct_human_idx) && direct_human_idx >= 1)
    {
        return direct_human_idx - 1;
    }
    return null;
}

/**
 * Translation Layer: Internal Code (0-indexed) → Human Label (1-indexed d[n] format).
 *
 * Output examples:
 *   0 → "d1"
 *   1 → "d2"
 *   2 → "d3"
 *   3 → "d4"
 *   4 → "d5"
 */
function get_axis_label(internal_idx: number): string
{
    return `d${internal_idx + 1}`;
}

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
            return 'Available commands: create --"<def_id>" --"<position>", move --"<uid>" --"<pos>", delete --"<uid>", camera --"<axis>=<depth>", help';
        }

        case 'camera':
        {
            const current = get_camera_plane();
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

            const dev = create_device(map, def_id, coords, []);
            return `Created device ${dev.definition_id} (ID: ${dev.unique_id}) at [${coords.join(', ')}]`;
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
            const existing = map.devices.find(d => d.unique_id === id);
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


