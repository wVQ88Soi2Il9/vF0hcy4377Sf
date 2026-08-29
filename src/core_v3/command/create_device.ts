import type { vector, namespaced_id } from '../primitives';
import type { device, space, device_constructor } from '../domain';
import type { reversible_operation } from '../reversible_operation';
import { trigger_hook } from '../hooks';

/**
 * 建立裝置之可逆指令。
 */
export function create_device_command
(
    device_class:  device_constructor,
    definition_id: namespaced_id,
    position:      vector,
    other_info:    Record<string, unknown> = {}
): reversible_operation
{
    let created_dev: device | null = null;

    return {
        pack: 'core',
        id:   'create_device',
        other_info:
        {
            ...other_info,
            core:
            {
                definition_id,
                position: [...position]
            }
        },
        execute(sp: space): void
        {
            if (!created_dev)
            {
                const assigned_uid = sp.uid;
                created_dev = new device_class(assigned_uid, definition_id, position, other_info);
                sp.uid += 1;
                sp.devices.push(created_dev);
                trigger_hook('device:create', sp, created_dev);
            }
            else
            {
                const exists = sp.devices.some(d => d.uid === created_dev!.uid);
                if (!exists)
                {
                    sp.devices.push(created_dev);
                    if (created_dev.uid >= sp.uid)
                    {
                        sp.uid = created_dev.uid + 1;
                    }
                    trigger_hook('device:create', sp, created_dev);
                }
            }
        },
        inverse(sp: space): void
        {
            if (created_dev)
            {
                const idx = sp.devices.findIndex(d => d.uid === created_dev!.uid);
                if (idx !== -1)
                {
                    const dev = sp.devices.splice(idx, 1)[0];
                    trigger_hook('device:delete', sp, dev);
                }
            }
        }
    };
}
(create_device_command as any).other_info = { cli: { describe: 'Create a device at target position' } };
