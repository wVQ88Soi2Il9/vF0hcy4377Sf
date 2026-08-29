import type { device, space } from '../domain';
import type { reversible_operation } from '../reversible_operation';
import { trigger_hook } from '../hooks';

/**
 * 刪除裝置之可逆指令。
 */
export function delete_device_command(device_uid: number): reversible_operation
{
    let deleted_dev: device | null = null;

    return {
        pack: 'core',
        id:   'delete_device',
        other_info:
        {
            core:
            {
                device_uid
            }
        },
        execute(sp: space): void
        {
            const target_uid = deleted_dev ? deleted_dev.uid : device_uid;
            const idx = sp.devices.findIndex(d => d.uid === target_uid);
            if (idx !== -1)
            {
                deleted_dev = sp.devices.splice(idx, 1)[0];
                trigger_hook('device:delete', sp, deleted_dev);
            }
        },
        inverse(sp: space): void
        {
            if (deleted_dev)
            {
                const exists = sp.devices.some(d => d.uid === deleted_dev!.uid);
                if (!exists)
                {
                    sp.devices.push(deleted_dev);
                    if (deleted_dev.uid >= sp.uid)
                    {
                        sp.uid = deleted_dev.uid + 1;
                    }
                    trigger_hook('device:create', sp, deleted_dev);
                }
            }
        }
    };
}
(delete_device_command as any).other_info = { cli: { describe: 'Delete a device by UID' } };
