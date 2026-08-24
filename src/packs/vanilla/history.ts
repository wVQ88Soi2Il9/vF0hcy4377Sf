import { get_history_tree, delete_node, compute_path_to_root } from '@/API';

// Pinned nodes registry
const pinned_nodes = new Set<number>();

/**
 * Checks if a specific history node is currently pinned.
 */
export function is_node_pinned(uid: number): boolean
{
    return pinned_nodes.has(uid);
}

/**
 * Sets the pinned state for a history node.
 * Returns true if successful, false if node does not exist in the history tree.
 */
export function set_node_pin(uid: number, pinned: boolean): boolean
{
    const tree = get_history_tree();
    if (!tree || !tree.nodes.has(uid))
    {
        return false;
    }

    if (pinned)
    {
        pinned_nodes.add(uid);
    }
    else
    {
        pinned_nodes.delete(uid);
    }
    return true;
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

    if (pinned_nodes.has(uid))
    {
        pinned_nodes.delete(uid);
        return false;
    }
    else
    {
        pinned_nodes.add(uid);
        return true;
    }
}

/**
 * Gets a list of all currently pinned node UIDs.
 */
export function get_pinned_nodes(): number[]
{
    return Array.from(pinned_nodes);
}

/**
 * Clears all pinned nodes.
 */
export function clear_all_pinned_nodes(): void
{
    pinned_nodes.clear();
}

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
        pinned_nodes.delete(uid); // Clean up pin if deleted
        delete_node(uid);
    }

    return true;
}
