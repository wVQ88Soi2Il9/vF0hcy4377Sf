/**
 * world.ts — 實體類別 class world 與多世界管理
 *
 * 實體契約：World = Space (幾何空間) + History (時間歷史) + Registry (法則註冊表)
 * 提供 Active World 管理中心與偏函式捷徑轉發。
 */

import type { history_tree, space_command, pack_registry, vector } from '@/core';
import
{
    space,
    create_history_tree,
    create_pack_registry,
    record_command as core_record_command,
    undo as core_undo,
    redo as core_redo,
    jump_to_node as core_jump_to_node,
    jump_to_prev_fork as core_jump_to_prev_fork,
    jump_to_root as core_jump_to_root,
    jump_to_leaf as core_jump_to_leaf,
    delete_node as core_delete_node
} from '@/core';

export interface world_options
{
    id?:       string;
    space?:    space;
    size?:     vector;
    history?:  history_tree;
    registry?: pack_registry;
}

/**
 * 實體類別：world = space + history + registry
 * 封裝空間幾何、歷史分支時間軸與法則註冊表。
 */
export class world
{
    public readonly id:        string;
    public          space:     space;
    public          history:   history_tree;
    public          registry:  pack_registry;

    constructor(options: world_options = {})
    {
        this.id = options.id ?? `world_${Date.now()}`;
        this.space = options.space ?? new space(options.size ?? [10, 10]);
        this.history = options.history ?? create_history_tree();
        this.registry = options.registry ?? create_pack_registry();
    }

    public get dimension(): number
    {
        return this.space.dimension;
    }

    /**
     * 在該世界上執行可逆指令。
     */
    public execute(cmd: space_command): void
    {
        core_record_command(this.history, this.space, cmd);
    }

    /**
     * 在該世界上撤銷上一步。
     */
    public undo(): boolean
    {
        return core_undo(this.history, this.space);
    }

    /**
     * 在該世界上重做下一步。
     */
    public redo(target_child_uid?: number): boolean
    {
        return core_redo(this.history, this.space, target_child_uid);
    }

    /**
     * 跳轉至指定歷史節點。
     */
    public jump_to(target_node_uid: number): boolean
    {
        return core_jump_to_node(this.history, this.space, target_node_uid);
    }

    /**
     * 跳轉至上一個分支點。
     */
    public jump_to_prev_fork(): boolean
    {
        return core_jump_to_prev_fork(this.history, this.space);
    }

    /**
     * 跳轉至歷史樹根節點（UID 0）。
     */
    public jump_to_root(): boolean
    {
        return core_jump_to_root(this.history, this.space);
    }

    /**
     * 跳轉至當前分支葉節點。
     */
    public jump_to_leaf(): boolean
    {
        return core_jump_to_leaf(this.history, this.space);
    }

    /**
     * 刪除指定歷史節點。
     */
    public delete_history_node(target_uid: number): boolean
    {
        return core_delete_node(this.history, target_uid);
    }
}

// ── Multi-World Registry & Active World State ────────────────────────────────

const _worlds: Map<string, world> = new Map();
let _active_world: world | undefined = undefined;

export function register_world(w: world): void
{
    _worlds.set(w.id, w);
    if (!_active_world)
    {
        _active_world = w;
    }
}

export function unregister_world(id: string): boolean
{
    if (_active_world?.id === id)
    {
        _active_world = undefined;
    }
    return _worlds.delete(id);
}

export function get_world(id: string): world | undefined
{
    return _worlds.get(id);
}

export function get_all_worlds(): world[]
{
    return Array.from(_worlds.values());
}

export function set_active_world(w: world | string): void
{
    if (typeof w === 'string')
    {
        const found = _worlds.get(w);
        if (found)
        {
            _active_world = found;
        }
    }
    else
    {
        _active_world = w;
        if (!_worlds.has(w.id))
        {
            _worlds.set(w.id, w);
        }
    }
}

export function get_active_world(): world | undefined
{
    return _active_world;
}

export function create_world(options: world_options = {}): world
{
    const w = new world(options);
    register_world(w);
    return w;
}

// ── Active World Convenience Proxies (Partial Application) ───────────────────

export function get_space(): space | undefined
{
    return _active_world?.space;
}

export function set_space(sp: space): void
{
    if (_active_world)
    {
        _active_world.space = sp;
    }
    else
    {
        const w = create_world({ space: sp });
        set_active_world(w);
    }
}

export function get_dimension(): number | undefined
{
    return _active_world?.dimension;
}

export function get_dim(): number | undefined
{
    return _active_world?.dimension;
}

export function get_registry(): pack_registry | undefined
{
    return _active_world?.registry;
}

export function set_registry(registry: pack_registry): void
{
    if (_active_world)
    {
        _active_world.registry = registry;
    }
    else
    {
        const w = create_world({ registry });
        set_active_world(w);
    }
}

export function get_history_tree(): history_tree | undefined
{
    return _active_world?.history;
}

export function set_history_tree(tree: history_tree): void
{
    if (_active_world)
    {
        _active_world.history = tree;
    }
    else
    {
        const w = create_world({ history: tree });
        set_active_world(w);
    }
}

/**
 * 在當前活躍世界上執行可逆指令。
 */
export function execute_command(cmd: space_command): void
{
    if (!_active_world)
    {
        throw new Error('Active world not initialized.');
    }
    _active_world.execute(cmd);
}

/**
 * 在當前活躍世界上撤銷上一步。
 */
export function undo(): boolean
{
    return _active_world?.undo() ?? false;
}

/**
 * 在當前活躍世界上重做下一步。
 */
export function redo(target_child_uid?: number): boolean
{
    return _active_world?.redo(target_child_uid) ?? false;
}

/**
 * 在當前活躍世界上跳轉至指定歷史節點。
 */
export function jump_to_history(target_node_uid: number): boolean
{
    return _active_world?.jump_to(target_node_uid) ?? false;
}

/**
 * 在當前活躍世界上跳轉至上一個分支點。
 */
export function jump_to_prev_fork(): boolean
{
    return _active_world?.jump_to_prev_fork() ?? false;
}


/**
 * 在當前活躍世界上跳轉至歷史樹根節點（UID 0）。
 */
export function jump_to_root(): boolean
{
    return _active_world?.jump_to_root() ?? false;
}

/**
 * 在當前活躍世界上跳轉至當前分支葉節點。
 */
export function jump_to_leaf(): boolean
{
    return _active_world?.jump_to_leaf() ?? false;
}

/**
 * 在當前活躍世界上刪除指定歷史節點。
 */
export function delete_history_node(target_uid: number): boolean
{
    return _active_world?.delete_history_node(target_uid) ?? false;
}
