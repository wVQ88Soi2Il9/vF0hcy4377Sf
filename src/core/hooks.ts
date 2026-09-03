/**
 * src/core/hooks.ts — World 實例 Hook 回呼顯式注入操作
 */

import type { hook_callback, namespaced_id } from './definition_i';
import type { pure_world } from './world';

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
