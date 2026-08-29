import { delete_node, find_lca, type history_node, type history_tree } from '@/core';
import { get_history_tree } from '@/world';

export interface vanilla_history_node_info
{
    pinned?:      boolean;
    merged_from?: number;
}

/**
 * Gets the $vanilla metadata from a history node's other_info.
 */
export function get_vanilla_node_info(uid: number, explicit_tree?: history_tree): vanilla_history_node_info | undefined
{
    const tree = explicit_tree ?? get_history_tree();
    const node = tree?.nodes.get(uid);
    return node?.other_info?.['vanilla'] as vanilla_history_node_info | undefined;
}

/**
 * Updates the $vanilla metadata in a history node's other_info.
 */
export function set_vanilla_node_info(uid: number, info: Partial<vanilla_history_node_info>, explicit_tree?: history_tree): boolean
{
    const tree = explicit_tree ?? get_history_tree();
    const node = tree?.nodes.get(uid);
    if (!node)
    {
        return false;
    }

    if (!node.other_info)
    {
        node.other_info = {};
    }

    const current_info = (node.other_info['vanilla'] as vanilla_history_node_info | undefined) ?? {};
    node.other_info['vanilla'] = { ...current_info, ...info };
    return true;
}

/**
 * Checks if a specific history node is currently pinned.
 */
export function is_node_pinned(uid: number, explicit_tree?: history_tree): boolean
{
    return get_vanilla_node_info(uid, explicit_tree)?.pinned ?? false;
}

/**
 * Sets the pinned state for a history node in its other_info['vanilla'].
 */
export function set_node_pin(uid: number, pinned: boolean, explicit_tree?: history_tree): boolean
{
    return set_vanilla_node_info(uid, { pinned }, explicit_tree);
}

/**
 * Toggles the pinned state of a history node.
 * Returns the new pinned state (boolean) or null if node does not exist.
 */
export function toggle_node_pin(uid: number, explicit_tree?: history_tree): boolean | null
{
    const tree = explicit_tree ?? get_history_tree();
    if (!tree || !tree.nodes.has(uid))
    {
        return null;
    }

    const current = is_node_pinned(uid, tree);
    const next = !current;
    set_node_pin(uid, next, tree);
    return next;
}

/**
 * Gets a list of all currently pinned node UIDs.
 */
export function get_pinned_nodes(explicit_tree?: history_tree): number[]
{
    const tree = explicit_tree ?? get_history_tree();
    if (!tree)
    {
        return [];
    }

    const pinned: number[] = [];
    for (const [uid, node] of tree.nodes)
    {
        const info = node.other_info?.['vanilla'] as vanilla_history_node_info | undefined;
        if (info?.pinned)
        {
            pinned.push(uid);
        }
    }
    return pinned;
}

/**
 * Clears all pinned nodes.
 */
export function clear_all_pinned_nodes(explicit_tree?: history_tree): void
{
    const tree = explicit_tree ?? get_history_tree();
    if (!tree)
    {
        return;
    }

    for (const [_, node] of tree.nodes)
    {
        const info = node.other_info?.['vanilla'] as vanilla_history_node_info | undefined;
        if (info && info.pinned)
        {
            info.pinned = false;
        }
    }
}

/**
 * Gets the merged_from node UID if this node is a merge node.
 */
export function get_node_merged_from(uid: number, explicit_tree?: history_tree): number | undefined
{
    return get_vanilla_node_info(uid, explicit_tree)?.merged_from;
}

/**
 * Sets the merged_from node UID in this node's $vanilla metadata.
 */
export function set_node_merged_from(uid: number, source_uid: number, explicit_tree?: history_tree): boolean
{
    return set_vanilla_node_info(uid, { merged_from: source_uid }, explicit_tree);
}

/**
 * Deletes an entire history branch (subtree) rooted at target_uid by repeatedly calling leaf-only delete_node.
 * Traverses descendant nodes in post-order so each node is guaranteed to be a leaf at deletion time.
 */
export function delete_branch(target_uid: number, explicit_tree?: history_tree): boolean
{
    if (target_uid === 0)
    {
        return false;
    }

    const tree = explicit_tree ?? get_history_tree();
    if (!tree)
    {
        return false;
    }

    const target_node = tree.nodes.get(target_uid);
    if (!target_node)
    {
        return false;
    }

    // Refuse deletion if target_uid is an ancestor on the active path leading to current_uid
    if (find_lca(tree, target_uid, tree.current_uid) === target_uid)
    {
        return false;
    }

    // Collect all descendant nodes in target subtree via post-order traversal (leaves first)
    const subtree_uids: number[] = [];
    function collect_post_order(uid: number): void
    {
        const node = tree?.nodes.get(uid);
        if (!node)
        {
            return;
        }
        for (const child_uid of node.children_uids)
        {
            collect_post_order(child_uid);
        }
        subtree_uids.push(uid);
    }
    collect_post_order(target_uid);

    // Repeatedly delete nodes from bottom up (guaranteed to be leaf at deletion time)
    for (const uid of subtree_uids)
    {
        delete_node(tree, uid);
    }

    return true;
}

/**
 * Extracts the chronological path of nodes from LCA to target_uid (excluding LCA itself).
 */
export function extract_branch_path(tree: history_tree, lca_uid: number, target_uid: number): history_node[]
{
    if (lca_uid === target_uid)
    {
        return [];
    }

    const path: history_node[] = [];
    let curr: number | null = target_uid;

    while (curr !== null && curr !== lca_uid)
    {
        const node = tree.nodes.get(curr);
        if (node)
        {
            path.push(node);
        }
        curr = node ? node.parent_uid : null;
    }

    return path.reverse();
}
