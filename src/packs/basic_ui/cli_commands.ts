import { register_cli_command, clean_flag_arg } from '@/packs/cli_tool';
import { basic_ui } from './index';

export function register_ui_cli_commands(): void
{
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
}
