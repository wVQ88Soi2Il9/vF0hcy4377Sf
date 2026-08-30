/**
 * src/world_v3.ts — 活體實例調度中心（Current worlds, may > 1）
 *
 * 職責：管理記憶體中活著的多個世界實例（_worlds: Map），
 * 維護當前操作焦點指標（_active_world），並提供 Active World 捷徑轉發。
 */

import { std_world, type world_options, type space, type history_tree, type pack_registry, type reversible_operation } from './core_v3';

// ── Multi-World Registry ─────────────────────────────────────────────────────

const _worlds: Map<string, std_world> = new Map();
let _active_world: std_world | undefined = undefined;

/**
 * 註冊世界實例至多世界倉庫。
 */
export function register_world(w: std_world): void
{
    _worlds.set(w.id, w);
    if (!_active_world)
    {
        _active_world = w;
    }
}

/**
 * 從多世界倉庫移除指定世界實例。
 */
export function unregister_world(id: string): boolean
{
    const deleted = _worlds.delete(id);
    if (_active_world?.id === id)
    {
        _active_world = _worlds.values().next().value;
    }
    return deleted;
}

/**
 * 依 ID 取得世界實例。
 */
export function get_world(id: string): std_world | undefined
{
    return _worlds.get(id);
}

/**
 * 取得所有已註冊世界實例清單。
 */
export function get_all_worlds(): std_world[]
{
    return Array.from(_worlds.values());
}

/**
 * 設定當前操作焦點之世界實例（Active World）。
 */
export function set_active_world(target: std_world | string): void
{
    if (typeof target === 'string')
    {
        const found = _worlds.get(target);
        if (found)
        {
            _active_world = found;
        }
    }
    else
    {
        _active_world = target;
        if (!_worlds.has(target.id))
        {
            register_world(target);
        }
    }
}

/**
 * 取得當前操作焦點之世界實例（Active World）。
 */
export function get_active_world(): std_world | undefined
{
    return _active_world;
}

/**
 * 便捷建立新世界實例，自動註冊並設為 Active World。
 */
export function create_world(options: world_options = {}): std_world
{
    const w = new std_world(options);
    register_world(w);
    set_active_world(w);
    return w;
}

// ── Active World Shortcut Proxies ────────────────────────────────────────────

export function get_space(): space | undefined
{
    return _active_world?.space;
}

export function set_space(sp: space): void
{
    if (!_active_world)
    {
        _active_world = create_world({ space: sp });
    }
    else
    {
        _active_world.space = sp;
    }
}

export function get_dimension(): number
{
    return _active_world?.dimension ?? 0;
}

export function get_history_tree(): history_tree | undefined
{
    return _active_world?.history;
}

export function set_history_tree(tree: history_tree): void
{
    if (!_active_world)
    {
        _active_world = create_world({ history: tree });
    }
    else
    {
        _active_world.history = tree;
    }
}

export function get_registry(): pack_registry | undefined
{
    return _active_world?.registry;
}

export function set_registry(reg: pack_registry): void
{
    if (!_active_world)
    {
        _active_world = create_world({ registry: reg });
    }
    else
    {
        _active_world.registry = reg;
    }
}

export function execute_command(command_or_name: reversible_operation | string, ...args: any[]): void
{
    if (!_active_world)
    {
        return;
    }

    if (typeof command_or_name === 'string')
    {
        const reg = _active_world.registry;
        for (const [_, pack] of reg.packs)
        {
            const factory = pack.operations?.[command_or_name];
            if (factory)
            {
                const cmd = factory(...args);
                _active_world.execute(cmd);
                return;
            }
        }
    }
    else
    {
        _active_world.execute(command_or_name);
    }
}

export function undo(): boolean
{
    return _active_world?.undo() ?? false;
}

export function redo(target_child_uid?: number): boolean
{
    return _active_world?.redo(target_child_uid) ?? false;
}

export function jump_to_history(target_node_uid: number): boolean
{
    return _active_world?.jump_to(target_node_uid) ?? false;
}

export function jump_to_prev_fork(): boolean
{
    return _active_world?.jump_to_prev_fork() ?? false;
}

export function jump_to_root(): boolean
{
    return _active_world?.jump_to_root() ?? false;
}

export function jump_to_leaf(): boolean
{
    return _active_world?.jump_to_leaf() ?? false;
}

export function delete_history_node(target_uid: number): boolean
{
    return _active_world?.delete_history_node(target_uid) ?? false;
}

export { std_world as world, type world_options };
