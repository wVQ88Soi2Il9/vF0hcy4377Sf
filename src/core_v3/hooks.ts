/**
 * src/core_v3/hooks.ts — World 實例 Hook 回呼顯式注入操作
 */

import type { hook_callback, namespaced_id } from './definition_i';
import type { pure_world } from './world';

/**
 * 顯式向指定 World 實例的特定 Hook 槽位注入回呼函式。
 */
export function inject_world_hook
(
    target_world: pure_world,
    target_hook:  namespaced_id,
    callback:     hook_callback
): void
{
    let pack_hooks = target_world.current_hook.get(target_hook.namespace);
    if (!pack_hooks)
    {
        pack_hooks = new Map();
        target_world.current_hook.set(target_hook.namespace, pack_hooks);
    }

    let callbacks = pack_hooks.get(target_hook.id);
    if (!callbacks)
    {
        callbacks = [];
        pack_hooks.set(target_hook.id, callbacks);
    }

    callbacks.push(callback);
}
