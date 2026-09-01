/**
 * src/core_v3/hooks.ts — World 實例 Hook 回呼顯式注入與管理
 */

import type { hook_callback, hook_list, namespaced_id } from './definition_i';
import type { pack_registry } from './definition_iii';
import type { pure_world } from './world';

/**
 * 依據 pack_registry 中各 Pack 宣告之 Hook，建立該世界的初始 Hook 槽位骨架。
 */
export function create_world_hooks(registry?: pack_registry): hook_list
{
    const hooks: hook_list = new Map();
    if (registry)
    {
        for (const pack of registry.packs.values())
        {
            if (pack.hooks)
            {
                for (const hook of pack.hooks)
                {
                    let pack_hooks = hooks.get(hook.namespace);
                    if (!pack_hooks)
                    {
                        pack_hooks = new Map();
                        hooks.set(hook.namespace, pack_hooks);
                    }
                    if (!pack_hooks.has(hook.id))
                    {
                        pack_hooks.set(hook.id, []);
                    }
                }
            }
        }
    }
    return hooks;
}

/**
 * 顯式向指定 World 實例的特定 Hook 槽位注入回呼函式（方案 B）。
 */
export function inject_world_hook
(
    target_world: pure_world,
    target_hook:  namespaced_id,
    callback:     hook_callback
): void
{
    target_world.current_hook.get(target_hook.namespace)?.get(target_hook.id)?.push(callback);
}
