import * as core from '@/core';

export interface vanilla_history_node_info
{
    pinned?:      boolean;
    merged_from?: core.uid;
}

export function get_vanilla_node_info(tree: core.tree, uid: core.uid): vanilla_history_node_info | undefined
{
    const node = tree.nodes.get(uid);
    return node?.other_info?.['vanilla'] as vanilla_history_node_info | undefined;
}

export function set_vanilla_node_info(tree: core.tree, uid: core.uid, info: Partial<vanilla_history_node_info>): boolean
{
    const node = tree.nodes.get(uid);
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

export function is_node_pinned(tree: core.tree, uid: core.uid): boolean
{
    return get_vanilla_node_info(tree, uid)?.pinned ?? false;
}

export function set_node_pin(tree: core.tree, uid: core.uid, pinned: boolean): boolean
{
    return set_vanilla_node_info(tree, uid, { pinned });
}

export function toggle_node_pin(tree: core.tree, uid: core.uid): boolean | null
{
    if (!tree.nodes.has(uid))
    {
        return null;
    }

    const current = is_node_pinned(tree, uid);
    const next = !current;
    set_node_pin(tree, uid, next);
    return next;
}

export function get_pinned_nodes(tree: core.tree): core.uid[]
{
    const pinned: core.uid[] = [];
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

export function clear_all_pinned_nodes(tree: core.tree): void
{
    for (const [_, node] of tree.nodes)
    {
        const info = node.other_info?.['vanilla'] as vanilla_history_node_info | undefined;
        if (info && info.pinned)
        {
            info.pinned = false;
        }
    }
}

export function get_node_merged_from(tree: core.tree, uid: core.uid): core.uid | undefined
{
    return get_vanilla_node_info(tree, uid)?.merged_from;
}

export function set_node_merged_from(tree: core.tree, uid: core.uid, source_uid: core.uid): boolean
{
    return set_vanilla_node_info(tree, uid, { merged_from: source_uid });
}

/**
 * Deletes a target node and all its descendant branches (subtree).
 */
export function delete_branch(tree: core.tree, target_uid: core.uid): boolean
{
    if (target_uid === 0)
    {
        return false;
    }

    const target_node = tree.nodes.get(target_uid);
    if (!target_node)
    {
        return false;
    }

    // Reject deletion if target_uid is on the active ancestor path
    let curr_check: core.uid | null = tree.current_history_uid;
    while (curr_check !== null)
    {
        if (curr_check === target_uid)
        {
            return false;
        }
        curr_check = tree.nodes.get(curr_check)?.parent_history_uid ?? null;
    }

    // Collect subtree nodes in post-order
    const subtree_uids: core.uid[] = [];
    function collect_post_order(uid: core.uid): void
    {
        const node = tree.nodes.get(uid);
        if (!node)
        {
            return;
        }
        for (const child_uid of node.children_history_uids)
        {
            collect_post_order(child_uid);
        }
        subtree_uids.push(uid);
    }
    collect_post_order(target_uid);

    // Delete from leaf to root
    for (const uid of subtree_uids)
    {
        core.delete_node(tree, uid);
    }

    return true;
}

/**
 * Extracts sequential node path from LCA to target_uid (excluding LCA itself).
 */
export function extract_branch_path(tree: core.tree, lca_uid: core.uid, target_uid: core.uid): core.node[]
{
    if (lca_uid === target_uid)
    {
        return [];
    }

    const path: core.node[] = [];
    let curr: core.uid | null = target_uid;

    while (curr !== null && curr !== lca_uid)
    {
        const node = tree.nodes.get(curr);
        if (node)
        {
            path.push(node);
        }
        curr = node?.parent_history_uid ?? null;
    }

    return path.reverse();
}
