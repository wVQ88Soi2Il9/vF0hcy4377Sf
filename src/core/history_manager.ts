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

export function delete_node(tree: history_tree, target_uid: number): boolean
{
    if (target_uid === 0 || target_uid === tree.current_uid)
    {
        return false;
    }

    const target_node = tree.nodes.get(target_uid);
    if (!target_node || target_node.parent_uid === null)
    {
        return false;
    }

    const parent_node = tree.nodes.get(target_node.parent_uid);
    if (!parent_node)
    {
        return false;
    }

    for (const child_uid of target_node.children_uids)
    {
        const child = tree.nodes.get(child_uid);
        if (child)
        {
            child.parent_uid = parent_node.uid;
        }
    }

    const idx = parent_node.children_uids.indexOf(target_uid);
    if (idx !== -1)
    {
        parent_node.children_uids.splice(idx, 1, ...target_node.children_uids);
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

export function jump_to_prev_fork(tree: history_tree, sp: space): boolean
{
    const target_uid = find_prev_fork_node(tree, tree.current_uid) ?? (tree.current_uid !== 0 ? 0 : null);
    if (target_uid === null)
    {
        return false;
    }

    while (tree.current_uid !== target_uid)
    {
        if (!undo(tree, sp))
        {
            return false;
        }
    }

    return true;
}

export function jump_to_next_fork(tree: history_tree, sp: space): boolean
{
    const target_uid = find_next_fork_node(tree, tree.current_uid);
    if (target_uid === null)
    {
        return false;
    }

    while (tree.current_uid !== target_uid)
    {
        if (!redo(tree, sp))
        {
            return false;
        }
    }

    return true;
}

export function jump_to_node(tree: history_tree, sp: space, target_uid: number): boolean
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

    while (tree.current_uid !== lca_uid)
    {
        if (!undo(tree, sp))
        {
            return false;
        }
    }

    const path_from_target = compute_path_to_root(tree, target_uid);
    const forward_uids: number[] = [];
    for (const uid of path_from_target)
    {
        if (uid === lca_uid)
        {
            break;
        }
        forward_uids.unshift(uid);
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

export function jump_to_root(tree: history_tree, sp: space): boolean
{
    let jumped = false;
    while (undo(tree, sp))
    {
        jumped = true;
    }
    return jumped;
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
