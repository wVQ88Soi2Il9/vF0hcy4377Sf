import { get_map, get_registry, execute_command as api_execute_command } from '@/runtime';
import { register_cli_command, clean_flag_arg } from '@/packs/cli_tool';
import { get_command } from '@/packs/vanilla';

export function register_layered_2d_cli_commands(): void
{
    // Rotate
    register_cli_command({
        name:        'rotate',
        usage:       'rotate --"<uid>" [--"<steps>"]',
        description: 'Rotate a 2.5D device counter-clockwise by steps (default: 1).',
        execute(args)
        {
            const map = get_map();
            if (!map) return 'Error: Global map instance not found.';
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
                const registry = get_registry();
                if (!registry) return 'Error: Global pack registry not found.';
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

    // Flip
    register_cli_command({
        name:        'flip',
        usage:       'flip --"<uid>"',
        description: 'Toggle vertical flip on a 2.5D device.',
        execute(args)
        {
            const map = get_map();
            if (!map) return 'Error: Global map instance not found.';
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
                const registry = get_registry();
                if (!registry) return 'Error: Global pack registry not found.';
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
}
