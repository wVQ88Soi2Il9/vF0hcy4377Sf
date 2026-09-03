/**
 * src/packs/vanilla_beta/history.ts — 歷史樹中繼資料與分支工具
 */

import * as core from '@/core';

export interface vanilla_history_node_info
{
    pinned?:      boolean;
    merged_from?: core.uid;
}

/**
 * 取得節點上 $vanilla 的中繼資料。
 */
export function get_vanilla_node_info(tree: core.tree, uid: core.uid): vanilla_history_node_info | undefined
{
    const node = tree.nodes.get(uid);
    return node?.other_info?.['vanilla'] as vanilla_history_node_info | undefined;
}

/**
 * 更新節點上 $vanilla 的中繼資料。
 */
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

/**
 * 檢查節點是否處於釘選狀態。
 */
export function is_node_pinned(tree: core.tree, uid: core.uid): boolean
{
    return get_vanilla_node_info(tree, uid)?.pinned ?? false;
}

/**
 * 設定節點的釘選狀態。
 */
export function set_node_pin(tree: core.tree, uid: core.uid, pinned: boolean): boolean
{
    return set_vanilla_node_info(tree, uid, { pinned });
}

/**
 * 切換節點的釘選狀態。
 */
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

/**
 * 取得所有釘選節點的 UID 清單。
 */
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

/**
 * 清除所有釘選節點。
 */
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

/**
 * 取得合併來源節點 UID。
 */
export function get_node_merged_from(tree: core.tree, uid: core.uid): core.uid | undefined
{
    return get_vanilla_node_info(tree, uid)?.merged_from;
}

/**
 * 設定合併來源節點 UID。
 */
export function set_node_merged_from(tree: core.tree, uid: core.uid, source_uid: core.uid): boolean
{
    return set_vanilla_node_info(tree, uid, { merged_from: source_uid });
}

/**
 * 刪除目標節點及其所有子孫分支（Subtree）。
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

    // 若 target_uid 位於當前活躍路徑（祖先線）上，拒絕刪除
    let curr_check: core.uid | null = tree.current_history_uid;
    while (curr_check !== null)
    {
        if (curr_check === target_uid)
        {
            return false;
        }
        curr_check = tree.nodes.get(curr_check)?.parent_history_uid ?? null;
    }

    // 後序走訪收集子樹節點
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

    // 由葉至根逐一刪除
    for (const uid of subtree_uids)
    {
        core.delete_node(tree, uid);
    }

    return true;
}

/**
 * 擷取自 LCA 至 target_uid 之節點順序路徑（不包含 LCA 本身）。
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
