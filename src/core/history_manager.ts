import type { game_map, history_node, history_tree, map_command } from './types';
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

export function record_command(tree: history_tree, map: game_map, cmd: map_command): history_node
{
    cmd.execute(map);

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

export function undo(tree: history_tree, map: game_map): boolean
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
        current_node.command.inverse(map);
    }

    tree.current_uid = current_node.parent_uid;
    trigger_history_change(tree);
    return true;
}

export function redo(tree: history_tree, map: game_map, target_child_uid?: number): boolean
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

    next_node.command.execute(map);
    tree.current_uid = next_node.uid;

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

export function compute_path_to_root(tree: history_tree, start_uid: number): number[]
{
    const path: number[] = [];
    let curr: number | null = start_uid;

    while (curr !== null)
    {
        path.push(curr);
        const node = tree.nodes.get(curr);
        curr = node ? node.parent_uid : null;
    }

    return path;
}

/**
 * 尋找兩節點之最近公共祖先（LCA）。
 * 沿 A 向上收集所有祖先至 Set，再沿 B 向上查找第一個交集節點。
 * 時間複雜度 O(depth_A + depth_B)，且不依賴 UID 之數值單調遞增特性。
 */
export function find_lca(tree: history_tree, uid_a: number, uid_b: number): number | null
{
    const ancestors = new Set<number>();
    let curr: number | null = uid_a;

    while (curr !== null)
    {
        ancestors.add(curr);
        const node = tree.nodes.get(curr);
        if (!node)
        {
            break;
        }
        curr = node.parent_uid;
    }

    curr = uid_b;
    while (curr !== null)
    {
        if (ancestors.has(curr))
        {
            return curr;
        }
        const node = tree.nodes.get(curr);
        if (!node)
        {
            break;
        }
        curr = node.parent_uid;
    }

    return null;
}

/**
 * 沿直系祖先路徑向上跳轉（當 ancestor_uid 為 current 之祖先節點時）。
 */
export function jump_to_ancestor(tree: history_tree, map: game_map, ancestor_uid: number): boolean
{
    while (tree.current_uid !== ancestor_uid)
    {
        if (!undo(tree, map))
        {
            return false;
        }
    }
    return true;
}

/**
 * 沿直系子孫路徑向下跳轉（當 descendant_uid 為 current 之子孫節點時）。
 */
export function jump_to_descendant(tree: history_tree, map: game_map, descendant_uid: number): boolean
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
        return false;
    }

    for (const next_uid of forward_uids)
    {
        if (!redo(tree, map, next_uid))
        {
            return false;
        }
    }
    return true;
}

export function jump_to_prev_fork(tree: history_tree, map: game_map): boolean
{
    const target_uid = find_prev_fork_node(tree, tree.current_uid) ?? (tree.current_uid !== 0 ? 0 : null);
    if (target_uid === null)
    {
        return false;
    }

    while (tree.current_uid !== target_uid)
    {
        if (!undo(tree, map))
        {
            return false;
        }
    }

    return true;
}

export function jump_to_next_fork(tree: history_tree, map: game_map): boolean
{
    const target_uid = find_next_fork_node(tree, tree.current_uid);
    if (target_uid === null)
    {
        return false;
    }

    while (tree.current_uid !== target_uid)
    {
        if (!redo(tree, map))
        {
            return false;
        }
    }

    return true;
}

/**
 * 跨分支任意節點跳轉：由 LCA 拆解為「先向上回到 LCA，再向下跳至目標子孫」。
 */
export function jump_to_node(tree: history_tree, map: game_map, target_uid: number): boolean
{
    if (tree.current_uid === target_uid)
    {
        return true;
    }

    const lca_uid = find_lca(tree, tree.current_uid, target_uid);
    if (lca_uid === null)
    {
        return false;
    }

    return jump_to_ancestor(tree, map, lca_uid) && jump_to_descendant(tree, map, target_uid);
}

export function jump_to_root(tree: history_tree, map: game_map): boolean
{
    let jumped = false;
    while (undo(tree, map))
    {
        jumped = true;
    }
    return jumped;
}

export function jump_to_leaf(tree: history_tree, map: game_map): boolean
{
    let jumped = false;
    while (redo(tree, map))
    {
        jumped = true;
    }
    return jumped;
}
