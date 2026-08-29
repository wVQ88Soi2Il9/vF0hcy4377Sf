import type { namespaced_id } from '../primitives';
import type { space } from '../domain';
import type { reversible_operation } from '../reversible_operation';
import { trigger_hook } from '../hooks';

/**
 * 設定配方之可逆指令。
 */
export function select_recipe_command(device_uid: number, new_recipe_id?: namespaced_id): reversible_operation
{
    let previous_recipe_id: namespaced_id | undefined = undefined;
    let initialized = false;

    return {
        pack: 'core',
        id:   'select_recipe',
        other_info:
        {
            core:
            {
                device_uid,
                new_recipe_id
            }
        },
        execute(sp: space): void
        {
            const dev = sp.devices.find(d => d.uid === device_uid);
            if (dev)
            {
                if (!initialized)
                {
                    previous_recipe_id = dev.selected_recipe_id;
                    initialized = true;
                }
                const old_id = dev.selected_recipe_id;
                dev.selected_recipe_id = new_recipe_id;
                trigger_hook('device:select_recipe', sp, dev, old_id, new_recipe_id);
            }
        },
        inverse(sp: space): void
        {
            if (initialized)
            {
                const dev = sp.devices.find(d => d.uid === device_uid);
                if (dev)
                {
                    const old_id = dev.selected_recipe_id;
                    dev.selected_recipe_id = previous_recipe_id;
                    trigger_hook('device:select_recipe', sp, dev, old_id, previous_recipe_id);
                }
            }
        }
    };
}
(select_recipe_command as any).other_info = { cli: { describe: 'Select recipe for a device' } };
