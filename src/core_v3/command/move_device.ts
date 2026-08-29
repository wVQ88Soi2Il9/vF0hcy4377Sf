import type { vector } from '../primitives';
import type { space } from '../domain';
import type { reversible_operation } from '../reversible_operation';
import { trigger_hook } from '../hooks';

/**
 * 移動裝置之可逆指令。
 */
export function move_device_command(device_uid: number, new_position: vector): reversible_operation
{
    let previous_position: vector | null = null;

    return {
        pack: 'core',
        id:   'move_device',
        other_info:
        {
            core:
            {
                device_uid,
                position: [...new_position]
            }
        },
        execute(sp: space): void
        {
            const dev = sp.devices.find(d => d.uid === device_uid);
            if (dev)
            {
                if (previous_position === null)
                {
                    previous_position = [...dev.position];
                }
                const old_pos = dev.position;
                dev.position = new_position;
                trigger_hook('device:move', sp, dev, old_pos, new_position);
            }
        },
        inverse(sp: space): void
        {
            if (previous_position !== null)
            {
                const dev = sp.devices.find(d => d.uid === device_uid);
                if (dev)
                {
                    const old_pos = dev.position;
                    dev.position = previous_position;
                    trigger_hook('device:move', sp, dev, old_pos, previous_position);
                }
            }
        }
    };
}
(move_device_command as any).other_info = { cli: { describe: 'Move a device to a new position' } };
