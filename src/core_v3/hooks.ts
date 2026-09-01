/**
 * src/core_v3/hooks.ts — World 實例 Hook 回呼顯式注入操作
 */

import type { hook_callback, hook_list, namespaced_id } from './definition_i';
import type { pack_registry } from './definition_iii';
import type { pure_world } from './world';

/**
 * 依據已就緒之 pack_registry，建構出完整的全域空 Hook 槽位清單（階段 3）。
 * 結構為 Map<namespace, Map<id, []>>。
 */
export function build_empty_hook_list(registry: pack_registry): hook_list
{
    const hooks: hook_list = new Map();
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
    return hooks;
}

/**
 * 顯式向指定 World 實例的特定 Hook 槽位注入回呼函式（階段 5：單行無條件注入）。
 */
export function inject_world_hook
(
    target_world: pure_world,
    target_hook:  namespaced_id,
    callback:     hook_callback
): void
{
    target_world.current_hook.get(target_hook.namespace)!.get(target_hook.id)!.push(callback);
}
