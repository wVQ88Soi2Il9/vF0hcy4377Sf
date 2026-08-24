import { get_history_tree, delete_node, compute_path_to_root } from '@/API';

/**
 * Deletes an entire history branch (subtree) rooted at target_uid by repeatedly calling delete_node.
 * Refuses deletion if:
 * 1. target_uid is 0 (Root node)
 * 2. target_uid is part of the active path to current HEAD (tree.current_uid)
 * 3. target node does not exist
 *
 * Returns true if deletion succeeded, false otherwise.
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
    // (children before parents, so each deletion is executed on a leaf node)
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
