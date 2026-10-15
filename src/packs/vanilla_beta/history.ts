import * as core from '@/core';

export interface vanilla_history_node_info
{
    pinned?:      boolean;
    merged_from?: core.uid;
}

export function get_vanilla_node_info(tree: core.tree, uid: core.uid): vanilla_history_node_info | undefined
{
    const node = tree.nodes.get(uid);
    if (!node)
    {
        throw new Error(`node ${uid} doesn't exist`);
    }
    return node.other_info?.['vanilla'] as vanilla_history_node_info | undefined;
}

export function set_vanilla_node_info(tree: core.tree, uid: core.uid, info: Partial<vanilla_history_node_info>): void
{
    const node = tree.nodes.get(uid);
    if (!node)
    {
        throw new Error(`node ${uid} doesn't exist`);
    }

    if (!node.other_info)
    {
        node.other_info = {};
    }

    const current_info = (node.other_info['vanilla'] as vanilla_history_node_info | undefined) ?? {};
    node.other_info['vanilla'] = { ...current_info, ...info };
}

export function is_node_pinned(tree: core.tree, uid: core.uid): boolean
{
    return get_vanilla_node_info(tree, uid)?.pinned ?? false;
}

export function set_node_pin(tree: core.tree, uid: core.uid, pinned: boolean): void
{
    set_vanilla_node_info(tree, uid, { pinned });
}

export function toggle_node_pin(tree: core.tree, uid: core.uid): boolean
{
    if (!tree.nodes.has(uid))
    {
        throw new Error(`node ${uid} doesn't exist`);
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

export function set_node_merged_from(tree: core.tree, uid: core.uid, source_uid: core.uid): void
{
    set_vanilla_node_info(tree, uid, { merged_from: source_uid });
}

export function delete_branch(tree: core.tree, target_uid: core.uid): boolean
{
    if (target_uid === 0)
    {
        return false;
    }

    if (!tree.nodes.has(target_uid))
    {
        throw new Error(`node ${target_uid} doesn't exist`);
    }

    // 若 target_uid 位於當前活躍路徑（祖先線）上，拒絕刪除
    let curr_check: core.uid | null = tree.current_history_uid;
    while (curr_check !== null)
    {
        if (curr_check === target_uid)
        {
            return false;
        }
        // 起點是 current,delete_node 只刪葉節點,父鏈必定完整
        curr_check = tree.nodes.get(curr_check)!.parent_history_uid;
    }

    const subtree_uids: core.uid[] = [];
    function collect_post_order(uid: core.uid): void
    {
        // uid 取自 children_history_uids,必定存在
        const node = tree.nodes.get(uid)!;
        for (const child_uid of node.children_history_uids)
        {
            collect_post_order(child_uid);
        }
        subtree_uids.push(uid);
    }
    collect_post_order(target_uid);

    // 由葉至根逐一刪除
    for (const uid of subtree_uids)
    {
        core.delete_node(tree, uid);
    }

    return true;
}

/**
 * 擷取自 LCA 至 target_uid 之節點順序路徑（不包含 LCA 本身）。
 * 前提:lca_uid 是 target_uid 的祖先(或相同),兩者皆存在。
 */
export function extract_branch_path(tree: core.tree, lca_uid: core.uid, target_uid: core.uid): core.node[]
{
    const path: core.node[] = [];
    let curr: core.uid = target_uid;

    while (curr !== lca_uid)
    {
        const node = tree.nodes.get(curr)!;
        path.push(node);
        curr = node.parent_history_uid!;
    }

    return path.reverse();
}
