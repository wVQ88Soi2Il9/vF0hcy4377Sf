import type { rotation_plane } from '@/core/types';
import { create_device, delete_device, move_device, rotate_device } from '@/API';
import { get_map } from '@/runtime';

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
            return 'Available commands: add <def_id> <x> <y> <z>, delete <id>, move <id> <x> <y> <z>, rotate <id> <axis_a> <axis_b> <steps>, help';
        }

        case 'add':
        {
            if (args.length < 4)
            {
                return 'Usage: add <def_id> <x> <y> <z> (e.g. add test:assembler 4 4 0)';
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

