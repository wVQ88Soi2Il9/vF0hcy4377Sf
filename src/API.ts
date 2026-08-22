/**
 * API.ts — 引擎公開事件契約
 *
 * 這是後續開發者（pack 作者）的唯一事件訂閱入口。
 * 每個函式都代表引擎支援的一個擴充點。
 * 新增引擎能力時，在此手動加入對應的訂閱函式。
 */

import
{
    hooks,
    type device_create_hook,
    type device_delete_hook,
    type device_move_hook,
    type device_select_recipe_hook,
    type check_overlap_hook,
    type build_graph_hook,
    type history_change_hook
} from '@/core/hooks';
import type { vector, map_command } from '@/core/types';
import { get_device_class } from '@/core/pack_manager';
import { create_device_command as core_create_device_command } from '@/core/commands';
import
{
    record_command as core_record_command,
    undo as core_undo,
    redo as core_redo,
    jump_to_node as core_jump_to_node,
    find_prev_fork_node,
    find_next_fork_node,
    find_leaf_node,
    jump_to_prev_fork as core_jump_to_prev_fork,
    jump_to_next_fork as core_jump_to_next_fork,
    jump_to_leaf as core_jump_to_leaf
} from '@/core/history_manager';
import { get_map, get_registry, get_history_tree } from '@/runtime';

export
{
    create_map,
    create_device,
    restore_device,
    delete_device,
    move_device,
    select_recipe
} from '@/core/map_manager';

export
{
    create_history_tree,
    record_command,
    undo as core_undo,
    redo as core_redo,
    jump_to_node as core_jump_to_node,
    compute_path_to_root,
    find_lca
} from '@/core/history_manager';

export
{
    delete_device_command,
    move_device_command,
    select_recipe_command
} from '@/core/commands';

export { get_history_tree } from '@/runtime';

/**
 * Executes a command on the active map and records it in the global history tree.
 */
export function execute_command(cmd: map_command): void
{
    const map  = get_map();
    const tree = get_history_tree();
    if (!map || !tree)
    {
        throw new Error('Global map or history tree not initialized.');
    }
    core_record_command(tree, map, cmd);
}

/**
 * Reverts the most recent command in the global history tree.
 * Returns true if undo succeeded.
 */
export function undo(): boolean
{
    const map  = get_map();
    const tree = get_history_tree();
    if (!map || !tree)
    {
        return false;
    }
    return core_undo(tree, map);
}

/**
 * Re-applies the latest undone command in the global history tree.
 * Returns true if redo succeeded.
 */
export function redo(): boolean
{
    const map  = get_map();
    const tree = get_history_tree();
    if (!map || !tree)
    {
        return false;
    }
    return core_redo(tree, map);
}

/**
 * Transitions the global map state to a specific history node by UID.
 * Returns true if jump succeeded.
 */
export function jump_to_history(target_node_uid: number): boolean
{
    const map  = get_map();
    const tree = get_history_tree();
    if (!map || !tree)
    {
        return false;
    }
    return core_jump_to_node(tree, map, target_node_uid);
}

/**
 * Transitions the global map state to the previous fork/branch point.
 * Returns true if jump succeeded.
 */
export function jump_to_prev_fork(): boolean
{
    const map  = get_map();
    const tree = get_history_tree();
    if (!map || !tree)
    {
        return false;
    }
    return core_jump_to_prev_fork(tree, map);
}

/**
 * Transitions the global map state to the next fork/branch point along the active branch.
 * Returns true if jump succeeded.
 */
export function jump_to_next_fork(): boolean
{
    const map  = get_map();
    const tree = get_history_tree();
    if (!map || !tree)
    {
        return false;
    }
    return core_jump_to_next_fork(tree, map);
}

/**
 * Transitions the global map state to the latest leaf step along the active branch.
 * Returns true if jump succeeded.
 */
export function jump_to_leaf(): boolean
{
    const map  = get_map();
    const tree = get_history_tree();
    if (!map || !tree)
    {
        return false;
    }
    return core_jump_to_leaf(tree, map);
}

export
{
    find_prev_fork_node,
    find_next_fork_node,
    find_leaf_node
};

/**
 * Subscribes to history tree changes (record, undo, redo, jump).
 * Returns an unsubscribe function.
 */
export function on_history_change(callback: history_change_hook): unsubscribe_function
{
    hooks.on_history_change.push(callback);
    return () =>
    {
        const index = hooks.on_history_change.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_history_change.splice(index, 1);
        }
    };
}

/**
 * Creates a reversible create_device command by looking up the device definition in the registry.
 */
export function create_device_command
(
    definition_id: string,
    position:      vector,
    other_info:    Record<string, unknown> = {}
): map_command
{
    const registry = get_registry();
    if (!registry)
    {
        throw new Error('Global pack registry not found.');
    }
    const dev_class = get_device_class(registry, definition_id);
    if (!dev_class)
    {
        throw new Error(`Device definition ID "${definition_id}" not found in registry.`);
    }
    return core_create_device_command(dev_class, definition_id, position, other_info);
}

export
{
    create_pack_registry,
    load_pack,
    unload_pack,
    get_item,
    get_recipe,
    register_recipe,
    register_device_class,
    get_device_class,
    evaluate_recipe,
    type pack_registry,
    type device_constructor
} from '@/core/pack_manager';

export
{
    device
} from '@/core/types';

export type
{
    vector,
    pack,
    item_definition,
    item_stack,
    recipe_evaluation,
    recipe_fn,
    recipe,
    game_map,
    map_command,
    history_node,
    history_tree
} from '@/core/types';

export
{
    is_valid_device_position,
    is_valid_port_position,
    get_port_axis
} from '@/utils/device_utils';

export type unsubscribe_function = () => void;

// ── 裝置生命週期 ──────────────────────────────────────────────────────────────

/**
 * 訂閱裝置建立事件。
 * 回傳取消訂閱函式。
 */
export function on_device_create(callback: device_create_hook): unsubscribe_function
{
    hooks.on_device_create.push(callback);
    return () =>
    {
        const index = hooks.on_device_create.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_create.splice(index, 1);
        }
    };
}

/**
 * 訂閱裝置刪除事件。
 * 回傳取消訂閱函式。
 */
export function on_device_delete(callback: device_delete_hook): unsubscribe_function
{
    hooks.on_device_delete.push(callback);
    return () =>
    {
        const index = hooks.on_device_delete.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_delete.splice(index, 1);
        }
    };
}

/**
 * 訂閱裝置移動事件。
 * 回傳取消訂閱函式。
 */
export function on_device_move(callback: device_move_hook): unsubscribe_function
{
    hooks.on_device_move.push(callback);
    return () =>
    {
        const index = hooks.on_device_move.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_move.splice(index, 1);
        }
    };
}

/**
 * 訂閱裝置選擇食譜變更事件。
 * 回傳取消訂閱函式。
 */
export function on_device_select_recipe(callback: device_select_recipe_hook): unsubscribe_function
{
    hooks.on_device_select_recipe.push(callback);
    return () =>
    {
        const index = hooks.on_device_select_recipe.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_select_recipe.splice(index, 1);
        }
    };
}

/**
 * 訂閱任意裝置生命週期變動（create / delete / move / select_recipe）。
 * 回傳取消訂閱函式。
 */
export function on_device_change(callback: () => void): unsubscribe_function
{
    const unsub_create        = on_device_create(() => callback());
    const unsub_delete        = on_device_delete(() => callback());
    const unsub_move          = on_device_move(() => callback());
    const unsub_select_recipe = on_device_select_recipe(() => callback());
    return () =>
    {
        unsub_create();
        unsub_delete();
        unsub_move();
        unsub_select_recipe();
    };
}

// ── 驗證系統 ──────────────────────────────────────────────────────────────────

/**
 * 注冊碰撞 / 越界檢查 Hook。
 * 引擎在需要驗證地圖時呼叫所有已注冊的函式並合併結果。
 */
export function register_overlap_check(fn: check_overlap_hook): unsubscribe_function
{
    hooks.on_check_overlap.push(fn);
    return () =>
    {
        const index = hooks.on_check_overlap.indexOf(fn);
        if (index !== -1)
        {
            hooks.on_check_overlap.splice(index, 1);
        }
    };
}

// ── 連接圖 ────────────────────────────────────────────────────────────────────

/**
 * 注冊連接圖建構 Hook。
 * 引擎在需要重建裝置連接關係時呼叫。
 */
export function register_graph_build(fn: build_graph_hook): unsubscribe_function
{
    hooks.on_build_graph.push(fn);
    return () =>
    {
        const index = hooks.on_build_graph.indexOf(fn);
        if (index !== -1)
        {
            hooks.on_build_graph.splice(index, 1);
        }
    };
}