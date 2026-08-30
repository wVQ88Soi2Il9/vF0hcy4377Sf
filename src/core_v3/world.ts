import type { uid } from './definition_i';
import { space } from './definition_ii';
import { reversible_operation } from './definition_iii';
import
{
    history_tree,
    create_history_tree,
    record_operation,
    delete_node,
    jump_prev_node,
    jump_next_node,
    jump_to_node,
    jump_to_prev_fork,
    jump_to_root,
    jump_to_next_fork,
} from './history';

export class empty_world
{
    public readonly id:        string;
    public          space:     space;
    public          history:   history_tree;

    constructor(sp: space, id?: string)
    {
        this.id = id ?? `world_${Date.now()}`;
        this.space = sp
        this.history = create_history_tree();
    }
}

/**
 * 實體類別：world = space + history
 * 定義世界的本質結構
 */
export class std_world extends empty_world
{
    public get dimension(): number
    {
        return this.space.dimension;
    }

    /**
     * 在該世界上執行可逆指令。
     */
    public execute(operation: reversible_operation): void
    {
        record_operation(this.history, this.space, operation);
    }

    /**
     * 在該世界上撤銷上一步。
     */
    public undo(): boolean
    {
        return jump_prev_node(this.history, this.space);
    }

    /**
     * 在該世界上重做下一步。
     */
    public redo(target?: uid): boolean
    {
        return jump_next_node(this.history, this.space, target);
    }

    /**
     * 跳轉至指定歷史節點。
     */
    public jump_to(target: uid): void
    {
        jump_to_node(this.history, this.space, target);
    }

    /**
     * 跳轉至上一個分支點。
     */
    public jump_to_prev_fork(): boolean
    {
        return jump_to_prev_fork(this.history, this.space);
    }

    /**
     * 跳轉至歷史樹根節點（UID 0）。
     */
    public jump_to_root(): boolean
    {
        return jump_to_root(this.history, this.space);
    }

    /**
     * 沿當前分支前進至最深處（葉節點或下一個分岔點）。
     */
    public jump_to_leaf(): boolean
    {
        return jump_to_next_fork(this.history, this.space);
    }

    /**
     * 刪除指定歷史節點。
     */
    public delete_history_node(target: uid): boolean
    {
        return delete_node(this.history, target);
    }
}
