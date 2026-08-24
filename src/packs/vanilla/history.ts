import { get_history_tree, delete_node, compute_path_to_root, type history_node, type history_tree, type vector } from '@/API';

export interface vanilla_history_node_info
{
    pinned?:      boolean;
    merged_from?: number;
}

/**
 * Gets the $vanilla metadata from a history node's other_info.
 */
export function get_vanilla_node_info(uid: number): vanilla_history_node_info | undefined
{
    const tree = get_history_tree();
    const node = tree?.nodes.get(uid);
    return node?.other_info?.['vanilla'] as vanilla_history_node_info | undefined;
}

/**
 * Updates the $vanilla metadata in a history node's other_info.
 */
export function set_vanilla_node_info(uid: number, info: Partial<vanilla_history_node_info>): boolean
{
    const tree = get_history_tree();
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
export function is_node_pinned(uid: number): boolean
{
    return get_vanilla_node_info(uid)?.pinned ?? false;
}

/**
 * Sets the pinned state for a history node in its other_info['vanilla'].
 */
export function set_node_pin(uid: number, pinned: boolean): boolean
{
    return set_vanilla_node_info(uid, { pinned });
}

/**
 * Toggles the pinned state of a history node.
 * Returns the new pinned state (boolean) or null if node does not exist.
 */
export function toggle_node_pin(uid: number): boolean | null
{
    const tree = get_history_tree();
    if (!tree || !tree.nodes.has(uid))
    {
        return null;
    }

    const current = is_node_pinned(uid);
    const next = !current;
    set_node_pin(uid, next);
    return next;
}

/**
 * Gets a list of all currently pinned node UIDs.
 */
export function get_pinned_nodes(): number[]
{
    const tree = get_history_tree();
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
export function clear_all_pinned_nodes(): void
{
    const tree = get_history_tree();
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
export function get_node_merged_from(uid: number): number | undefined
{
    return get_vanilla_node_info(uid)?.merged_from;
}

/**
 * Sets the merged_from node UID in this node's $vanilla metadata.
 */
export function set_node_merged_from(uid: number, source_uid: number): boolean
{
    return set_vanilla_node_info(uid, { merged_from: source_uid });
}

/**
 * Deletes an entire history branch (subtree) rooted at target_uid by repeatedly calling delete_node.
 */
export function delete_branch(target_uid: number): boolean
{
    if (target_uid === 0)
    {
        return false;
    }

    const tree = get_history_tree();
    if (!tree)
    {
        return false;
    }

    const target_node = tree.nodes.get(target_uid);
    if (!target_node)
    {
        return false;
    }

    // Refuse deletion if target_uid is on the active path leading to current_uid
    const active_path = compute_path_to_root(tree, tree.current_uid);
    if (active_path.includes(target_uid))
    {
        return false;
    }

    // Collect all descendant nodes in target subtree via post-order traversal
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

    // Repeatedly delete nodes from bottom up
    for (const uid of subtree_uids)
    {
        delete_node(uid);
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

export interface merge_conflict
{
    type:           'divergent_move' | 'divergent_recipe' | 'modify_deleted_device' | 'delete_modified_device';
    device_uid:     number;
    message:        string;
    source_detail?: unknown;
    target_detail?: unknown;
}

export interface merge_conflict_check_result
{
    has_conflict: boolean;
    conflicts:    merge_conflict[];
}

export interface branch_device_mutation
{
    created:         boolean;
    deleted:         boolean;
    moved:           boolean;
    final_position?: vector;
    recipe_changed:  boolean;
    final_recipe?:   string;
}

function are_positions_equal(p1?: vector, p2?: vector): boolean
{
    if (!p1 || !p2 || p1.length !== p2.length)
    {
        return false;
    }
    return p1.every((v, i) => v === p2[i]);
}

/**
 * Aggregates device mutations along a historical branch path.
 */
export function aggregate_branch_mutations(nodes: history_node[]): Map<number, branch_device_mutation>
{
    const mutations = new Map<number, branch_device_mutation>();

    function get_or_create(uid: number): branch_device_mutation
    {
        let m = mutations.get(uid);
        if (!m)
        {
            m = {
                created:        false,
                deleted:        false,
                moved:          false,
                recipe_changed: false
            };
            mutations.set(uid, m);
        }
        return m;
    }

    for (const node of nodes)
    {
        const cmd = node.command;
        if (!cmd)
        {
            continue;
        }

        if (cmd.pack === 'core' && cmd.id === 'create_device')
        {
            const uid = cmd.other_info?.device_uid as number | undefined;
            if (uid !== undefined)
            {
                const m = get_or_create(uid);
                m.created = true;
                m.deleted = false;
                m.moved = true;
                m.final_position = cmd.other_info?.position as vector | undefined;
            }
        }
        else if (cmd.pack === 'core' && cmd.id === 'move_device')
        {
            const uid = cmd.other_info?.device_uid as number | undefined;
            if (uid !== undefined)
            {
                const m = get_or_create(uid);
                m.moved = true;
                m.final_position = cmd.other_info?.position as vector | undefined;
            }
        }
        else if (cmd.pack === 'core' && cmd.id === 'select_recipe')
        {
            const uid = cmd.other_info?.device_uid as number | undefined;
            if (uid !== undefined)
            {
                const m = get_or_create(uid);
                m.recipe_changed = true;
                m.final_recipe = cmd.other_info?.new_recipe_id as string | undefined;
            }
        }
        else if (cmd.pack === 'core' && cmd.id === 'delete_device')
        {
            const uid = cmd.other_info?.device_uid as number | undefined;
            if (uid !== undefined)
            {
                const m = get_or_create(uid);
                m.deleted = true;
            }
        }
    }

    return mutations;
}

/**
 * Performs a 3-way conflict detection between source branch (LCA -> S) and target branch (LCA -> T).
 * Strictly detects:
 * 1. Divergent position moves on the same device
 * 2. Divergent recipe selections on the same device
 * 3. Modifying a device that was deleted in the other branch
 * Spatial overlaps are intentionally ignored per design.
 */
export function check_merge_conflicts
(
    tree:       history_tree,
    lca_uid:    number,
    source_uid: number,
    target_uid: number
): merge_conflict_check_result
{
    const source_path = extract_branch_path(tree, lca_uid, source_uid);
    const target_path = extract_branch_path(tree, lca_uid, target_uid);

    const source_mutations = aggregate_branch_mutations(source_path);
    const target_mutations = aggregate_branch_mutations(target_path);

    const conflicts: merge_conflict[] = [];

    // Inspect all devices touched by the source branch
    for (const [uid, s_mut] of source_mutations)
    {
        // Newly created devices in source branch do not conflict with target pre-merge devices
        if (s_mut.created)
        {
            continue;
        }

        const t_mut = target_mutations.get(uid);
        if (!t_mut)
        {
            // Target did not touch this device -> cleanly applicable
            continue;
        }

        // Case 1: Source modified, but Target deleted
        if ((s_mut.moved || s_mut.recipe_changed) && !s_mut.deleted && t_mut.deleted)
        {
            conflicts.push
            ({
                type:          'modify_deleted_device',
                device_uid:    uid,
                message:       `Device #${uid} was modified in source branch, but deleted in target branch.`,
                source_detail: { moved: s_mut.moved, recipe: s_mut.final_recipe },
                target_detail: { deleted: true }
            });
            continue;
        }

        // Case 2: Source deleted, but Target modified
        if (s_mut.deleted && (t_mut.moved || t_mut.recipe_changed) && !t_mut.deleted)
        {
            conflicts.push
            ({
                type:          'delete_modified_device',
                device_uid:    uid,
                message:       `Device #${uid} was deleted in source branch, but modified in target branch.`,
                source_detail: { deleted: true },
                target_detail: { moved: t_mut.moved, recipe: t_mut.final_recipe }
            });
            continue;
        }

        // Case 3: Both moved the device to different positions
        if (s_mut.moved && t_mut.moved && !s_mut.deleted && !t_mut.deleted)
        {
            if (!are_positions_equal(s_mut.final_position, t_mut.final_position))
            {
                conflicts.push
                ({
                    type:          'divergent_move',
                    device_uid:    uid,
                    message:       `Device #${uid} was moved to [${s_mut.final_position?.join(', ')}] in source, but moved to [${t_mut.final_position?.join(', ')}] in target.`,
                    source_detail: s_mut.final_position,
                    target_detail: t_mut.final_position
                });
            }
        }

        // Case 4: Both changed recipe to different recipes
        if (s_mut.recipe_changed && t_mut.recipe_changed && !s_mut.deleted && !t_mut.deleted)
        {
            if (s_mut.final_recipe !== t_mut.final_recipe)
            {
                conflicts.push
                ({
                    type:          'divergent_recipe',
                    device_uid:    uid,
                    message:       `Device #${uid} recipe was set to "${s_mut.final_recipe ?? 'none'}" in source, but "${t_mut.final_recipe ?? 'none'}" in target.`,
                    source_detail: s_mut.final_recipe,
                    target_detail: t_mut.final_recipe
                });
            }
        }
    }

    return {
        has_conflict: conflicts.length > 0,
        conflicts
    };
}
