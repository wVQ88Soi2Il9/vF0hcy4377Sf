import type { vector } from './primitives';
import type { space_command } from './command/command';
import { space } from './domain';
import { pack_registry, create_pack_registry } from './registry';
import
{
    history_tree,
    create_history_tree,
    record_command as core_record_command,
    delete_node as core_delete_node,
    undo as core_undo,
    redo as core_redo,
    jump_to_node as core_jump_to_node,
    jump_to_prev_fork as core_jump_to_prev_fork,
    jump_to_root as core_jump_to_root,
    jump_to_next_fork as core_jump_to_leaf
} from './history';

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
 * 定義世界的本質結構與實體行為契約。
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
     * 沿當前分支前進至最深處（葉節點或下一個分岔點）。
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
