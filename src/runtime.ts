/**
 * runtime.ts — 應用全域狀態容器與捷徑操作
 *
 * 應用啟動期的全域狀態容器（地圖、全域 Registry、歷史樹）與捷徑輔助函式。
 */

import type { game_map, history_tree, map_command } from '@/core';
import type { pack_registry } from '@/core';
import
{
    record_command as core_record_command,
    undo as core_undo,
    redo as core_redo,
    jump_to_node as core_jump_to_node,
    jump_to_prev_fork as core_jump_to_prev_fork,
    jump_to_next_fork as core_jump_to_next_fork,
    jump_to_root as core_jump_to_root,
    jump_to_leaf as core_jump_to_leaf,
    delete_node as core_delete_node
} from '@/core';

let _map:          game_map      | undefined = undefined;
let _registry:     pack_registry | undefined = undefined;
let _history_tree: history_tree  | undefined = undefined;

export function set_map(map: game_map): void
{
    _map = map;
}

export function get_map(): game_map | undefined
{
    return _map;
}

export function get_dimension(): number | undefined
{
    return _map?.dimension;
}

export function get_dim(): number | undefined
{
    return _map?.dimension;
}

export function set_registry(registry: pack_registry): void
{
    _registry = registry;
}

export function get_registry(): pack_registry | undefined
{
    return _registry;
}

export function set_history_tree(tree: history_tree): void
{
    _history_tree = tree;
}

export function get_history_tree(): history_tree | undefined
{
    return _history_tree;
}

/**
 * 在當前全域地圖與歷史樹上執行指令。
 */
export function execute_command(cmd: map_command): void
{
    if (!_map || !_history_tree)
    {
        throw new Error('Global map or history tree not initialized.');
    }
    core_record_command(_history_tree, _map, cmd);
}

/**
 * 在當前全域地圖與歷史樹上撤銷上一步。
 */
export function undo(): boolean
{
    if (!_map || !_history_tree)
    {
        return false;
    }
    return core_undo(_history_tree, _map);
}

/**
 * 在當前全域地圖與歷史樹上重做下一步。
 */
export function redo(): boolean
{
    if (!_map || !_history_tree)
    {
        return false;
    }
    return core_redo(_history_tree, _map);
}

/**
 * 跳轉至指定歷史節點。
 */
export function jump_to_history(target_node_uid: number): boolean
{
    if (!_map || !_history_tree)
    {
        return false;
    }
    return core_jump_to_node(_history_tree, _map, target_node_uid);
}

/**
 * 跳轉至上一個分支點。
 */
export function jump_to_prev_fork(): boolean
{
    if (!_map || !_history_tree)
    {
        return false;
    }
    return core_jump_to_prev_fork(_history_tree, _map);
}

/**
 * 跳轉至下一個分支點。
 */
export function jump_to_next_fork(): boolean
{
    if (!_map || !_history_tree)
    {
        return false;
    }
    return core_jump_to_next_fork(_history_tree, _map);
}

/**
 * 跳轉至歷史樹根節點（UID 0）。
 */
export function jump_to_root(): boolean
{
    if (!_map || !_history_tree)
    {
        return false;
    }
    return core_jump_to_root(_history_tree, _map);
}

/**
 * 跳轉至當前分支葉節點。
 */
export function jump_to_leaf(): boolean
{
    if (!_map || !_history_tree)
    {
        return false;
    }
    return core_jump_to_leaf(_history_tree, _map);
}

/**
 * 刪除指定歷史節點。
 */
export function delete_history_node(target_uid: number): boolean
{
    if (!_history_tree)
    {
        return false;
    }
    return core_delete_node(_history_tree, target_uid);
}
