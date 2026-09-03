import type { history_node, history_tree, space_command } from './types';
import type { space } from './space_manager';
import { trigger_history_change } from './hooks';

export function create_history_tree(): history_tree
{
    const root_node: history_node =
    {
        uid:           0,
        parent_uid:    null,
        children_uids: [],
        command:       null
    };

    return {
        nodes:         new Map([[0, root_node]]),
        current_uid:   0,
        next_node_uid: 1
    };
}

export function record_command(tree: history_tree, sp: space, cmd: space_command): history_node
{
    cmd.execute(sp);

    const new_node: history_node =
    {
        uid:           tree.next_node_uid,
        parent_uid:    tree.current_uid,
        children_uids: [],
        command:       cmd
    };

    const parent = tree.nodes.get(tree.current_uid);
    if (parent)
    {
        parent.children_uids.push(new_node.uid);
    }

    tree.nodes.set(new_node.uid, new_node);
    tree.current_uid = new_node.uid;
    tree.next_node_uid += 1;

    trigger_history_change(tree);
    return new_node;
}

/**
 * 從歷史樹中刪除一個末端葉節點（Leaf Node）。
 * 嚴格限制：僅能刪除無子節點（children_uids.length === 0）的葉節點，避免破壞因果歷史連續性。
 */
export function delete_node(tree: history_tree, target_uid: number): boolean
{
    const target = tree.nodes.get(target_uid);
    if (!target || target_uid === tree.current_uid || target.children_uids.length > 0 || target.parent_uid === null)
    {
        return false;
    }

    const parent = tree.nodes.get(target.parent_uid);
    if (parent)
    {
        parent.children_uids = parent.children_uids.filter(id => id !== target_uid);
    }

    tree.nodes.delete(target_uid);
    trigger_history_change(tree);
    return true;
}

export function undo(tree: history_tree, sp: space): boolean
{
    if (tree.current_uid === 0)
    {
        return false;
    }

    const current_node = tree.nodes.get(tree.current_uid);
    if (!current_node || current_node.parent_uid === null)
    {
        return false;
    }

    if (current_node.command)
    {
        current_node.command.inverse(sp);
    }

    tree.current_uid = current_node.parent_uid;
    trigger_history_change(tree);
    return true;
}

export function find_prev_fork_node(tree: history_tree, start_uid: number = tree.current_uid): number | null
{
    const start_node = tree.nodes.get(start_uid);
    if (!start_node || start_node.parent_uid === null)
    {
        return null;
    }

    let curr: number | null = start_node.parent_uid;
    while (curr !== null)
    {
        const node = tree.nodes.get(curr);
        if (!node)
        {
            break;
        }

        if (node.children_uids.length > 1)
        {
            return node.uid;
        }

        curr = node.parent_uid;
    }

    return null;
}

/**
 * 沿直系祖先路徑向上跳轉（當 ancestor_uid 為 current 之祖先節點時）。
 */
export function jump_to_ancestor(tree: history_tree, sp: space, ancestor_uid: number): boolean
{
    while (tree.current_uid !== ancestor_uid)
    {
        if (!undo(tree, sp))
        {
            return false;
        }
    }
    return true;
}

export function jump_to_prev_fork(tree: history_tree, sp: space): boolean
{
    let jumped = false;
    while (undo(tree, sp))
    {
        jumped = true;
        const current = tree.nodes.get(tree.current_uid);
        if (current && (current.children_uids.length > 1 || current.parent_uid === null))
        {
            break;
        }
    }
    return jumped;
}

export function jump_to_root(tree: history_tree, sp: space): boolean
{
    return jump_to_ancestor(tree, sp, 0);
}

export function redo(tree: history_tree, sp: space, target_child_uid?: number): boolean
{
    const current_node = tree.nodes.get(tree.current_uid);
    if (!current_node)
    {
        return false;
    }

    let next_uid: number;
    if (target_child_uid !== undefined)
    {
        if (!current_node.children_uids.includes(target_child_uid))
        {
            return false;
        }
        next_uid = target_child_uid;
    }
    else
    {
        if (current_node.children_uids.length !== 1)
        {
            return false;
        }
        next_uid = current_node.children_uids[0];
    }

    const next_node = tree.nodes.get(next_uid);
    if (!next_node || !next_node.command)
    {
        return false;
    }

    next_node.command.execute(sp);
    tree.current_uid = next_node.uid;

    trigger_history_change(tree);
    return true;
}

export function find_next_fork_node(tree: history_tree, start_uid: number = tree.current_uid): number | null
{
    const start_node = tree.nodes.get(start_uid);
    if (!start_node || start_node.children_uids.length !== 1)
    {
        return null;
    }

    let curr: number = start_node.children_uids[0];
    while (true)
    {
        const node = tree.nodes.get(curr);
        if (!node)
        {
            break;
        }

        if (node.children_uids.length > 1)
        {
            return node.uid;
        }

        if (node.children_uids.length === 0)
        {
            break;
        }

        curr = node.children_uids[0];
    }

    return null;
}

/**
 * 沿直系子孫路徑向下跳轉（當 descendant_uid 為 current 之子孫節點時）。
 */
export function jump_to_descendant(tree: history_tree, sp: space, descendant_uid: number): boolean
{
    const forward_uids: number[] = [];
    let curr: number | null = descendant_uid;
    while (curr !== null && curr !== tree.current_uid)
    {
        forward_uids.unshift(curr);
        curr = tree.nodes.get(curr)?.parent_uid ?? null;
    }

    if (curr !== tree.current_uid)
    {
        return false; // target 不是 current 的直系子孫
    }

    for (const next_uid of forward_uids)
    {
        if (!redo(tree, sp, next_uid))
        {
            return false;
        }
    }
    return true;
}

export function jump_to_leaf(tree: history_tree, sp: space): boolean
{
    let jumped = false;
    while (redo(tree, sp))
    {
        jumped = true;
    }
    return jumped;
}

/**
 * 歐幾里得輾轉相除法（Euclidean LCA Algorithm）：
 * 藉由 UID 嚴格單調遞減性質（parent_uid < uid），以雙指針追逐法找出兩節點之最近公共祖先。
 * 當較大指針的上游分岔點仍大於等於較小指針時，可透過 find_prev_fork_node 進行跨區間跳躍。
 */
export function find_lca(tree: history_tree, uid_a: number, uid_b: number): number
{
    let a = uid_a;
    let b = uid_b;

    while (a !== b)
    {
        if (a > b)
        {
            const fork = find_prev_fork_node(tree, a);
            a = (fork !== null && fork >= b) ? fork : (tree.nodes.get(a)?.parent_uid ?? 0);
        }
        else
        {
            const fork = find_prev_fork_node(tree, b);
            b = (fork !== null && fork >= a) ? fork : (tree.nodes.get(b)?.parent_uid ?? 0);
        }
    }

    return a;
}

/**
 * 跨分支任意節點跳轉：由 LCA 拆解為「先向上跳至 LCA，再向下跳至目標子孫」。
 */
export function jump_to_node(tree: history_tree, sp: space, target_uid: number): boolean
{
    if (tree.current_uid === target_uid)
    {
        return true;
    }

    const lca_uid = find_lca(tree, tree.current_uid, target_uid);

    return jump_to_ancestor(tree, sp, lca_uid) && jump_to_descendant(tree, sp, target_uid);
}
