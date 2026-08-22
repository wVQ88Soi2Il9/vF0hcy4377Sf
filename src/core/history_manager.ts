import type { game_map, history_node, history_tree, map_command } from '@/core/types';
import { trigger_history_change } from '@/core/hooks';

/**
 * Creates an empty history tree with root node (UID 0).
 */
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

/**
 * Executes a command and records it as a new child node in the history tree.
 * Updates current_uid to the newly created node.
 */
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
 * Reverts the most recent command by stepping back to the parent node.
 * Returns true if undo succeeded, false if already at root.
 */
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

/**
 * Re-applies the most recent undone command along the latest child branch.
 * Returns true if redo succeeded, false if at leaf node.
 */
export function redo(tree: history_tree, map: game_map): boolean
{
    const current_node = tree.nodes.get(tree.current_uid);
    if (!current_node || current_node.children_uids.length === 0)
    {
        return false;
    }

    const next_uid = current_node.children_uids[current_node.children_uids.length - 1];
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

/**
 * Computes the ancestral path from a node up to root (0).
 */
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
 * Finds the Lowest Common Ancestor (LCA) UID between two history nodes.
 */
export function find_lca(tree: history_tree, uid_a: number, uid_b: number): number | null
{
    const path_a = compute_path_to_root(tree, uid_a);
    const path_b = compute_path_to_root(tree, uid_b);
    const set_b  = new Set(path_b);

    for (const uid of path_a)
    {
        if (set_b.has(uid))
        {
            return uid;
        }
    }

    return null;
}

/**
 * Transitions the map state from current_uid to target_uid in the history tree.
 * Reverts commands up to LCA, then executes commands forward to target_uid.
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

    // 1. 倒帶回 LCA
    let curr: number | null = tree.current_uid;
    while (curr !== null && curr !== lca_uid)
    {
        const node = tree.nodes.get(curr);
        node?.command?.inverse(map);
        curr = node ? node.parent_uid : null;
    }

    // 2. 從 LCA 快轉到目標
    const forward_nodes: history_node[] = [];
    curr = target_uid;
    while (curr !== null && curr !== lca_uid)
    {
        const node = tree.nodes.get(curr);
        if (node)
        {
            forward_nodes.push(node);
        }
        curr = node ? node.parent_uid : null;
    }

    for (let i = forward_nodes.length - 1; i >= 0; i--)
    {
        forward_nodes[i].command?.execute(map);
    }

    tree.current_uid = target_uid;
    trigger_history_change(tree);
    return true;
}

/**
 * Finds the closest ancestor node from start_uid that has multiple branches (> 1 children).
 */
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
 * Finds the closest downstream descendant node along the active child branch that has multiple branches (> 1 children).
 */
export function find_next_fork_node(tree: history_tree, start_uid: number = tree.current_uid): number | null
{
    let curr: number = start_uid;

    while (true)
    {
        const node = tree.nodes.get(curr);
        if (!node || node.children_uids.length === 0)
        {
            break;
        }

        const next_uid = node.children_uids[node.children_uids.length - 1];
        const next_node = tree.nodes.get(next_uid);
        if (!next_node)
        {
            break;
        }

        if (next_node.children_uids.length > 1)
        {
            return next_node.uid;
        }

        curr = next_uid;
    }

    return null;
}

/**
 * Transitions the map state to the previous fork/branch point.
 * If no previous fork exists but not at root, jumps to root.
 */
export function jump_to_prev_fork(tree: history_tree, map: game_map): boolean
{
    const prev_fork_uid = find_prev_fork_node(tree, tree.current_uid);
    if (prev_fork_uid !== null)
    {
        return jump_to_node(tree, map, prev_fork_uid);
    }

    if (tree.current_uid !== 0)
    {
        return jump_to_node(tree, map, 0);
    }

    return false;
}

/**
 * Transitions the map state to the next downstream fork/branch point along the active branch.
 */
export function jump_to_next_fork(tree: history_tree, map: game_map): boolean
{
    const next_fork_uid = find_next_fork_node(tree, tree.current_uid);
    if (next_fork_uid !== null)
    {
        return jump_to_node(tree, map, next_fork_uid);
    }

    return false;
}

