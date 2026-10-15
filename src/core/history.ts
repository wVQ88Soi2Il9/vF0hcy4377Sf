import { type uid, generate_uid } from './definition_i';
import type { space } from './definition_ii';
import { rev_op } from './definition_iii';

export interface node
{
    history_uid:           uid;
    parent_history_uid:    uid | null;
    children_history_uids: uid[];
    operations:            rev_op[];
    other_info?:           Record<string, unknown>;
}

export interface tree
{
    nodes:               Map<uid, node>;
    root_history_uid:    uid;
    current_history_uid: uid;
}

export function create_tree(): tree
{
    const root_uid = generate_uid();
    const root_node: node =
    {
        history_uid:           root_uid,
        parent_history_uid:    null,
        children_history_uids: [],
        operations:            []
    };

    return {
        nodes:               new Map([[root_uid, root_node]]),
        root_history_uid:    root_uid,
        current_history_uid: root_uid
    };
}

export function record_operation
(
    tree:        tree,
    sp:          space,
    operations:  rev_op[],
    other_info?: Record<string, unknown>
): node
{
    const history_uid = generate_uid();
    if (tree.nodes.has(history_uid))
    {
        throw new Error(`history uid ${history_uid} already exists`);
    }

    for (const op of operations)
    {
        op.execute(sp);
    }

    const new_node: node =
    {
        history_uid:           history_uid,
        parent_history_uid:    tree.current_history_uid,
        children_history_uids: [],
        operations:            operations,
        other_info
    };

    const parent = tree.nodes.get(tree.current_history_uid);
    if (parent)
    {
        parent.children_history_uids.push(new_node.history_uid);
    }

    tree.nodes.set(new_node.history_uid, new_node);
    tree.current_history_uid = new_node.history_uid;

    return new_node;
}

export function delete_node(tree: tree, target_uid: uid): boolean
{
    const target = tree.nodes.get(target_uid);
    if (!target)
    {
        throw new Error(`target ${target_uid} doesn't exist`);
    }
    if (target_uid === tree.current_history_uid || target.children_history_uids.length > 0 || target.parent_history_uid === null)
    {
        return false;
    }

    const parent = tree.nodes.get(target.parent_history_uid)!;
    parent.children_history_uids = parent.children_history_uids.filter(id => id !== target_uid);

    tree.nodes.delete(target_uid);
    return true;
}

export function jump_prev_node(tree: tree, sp: space): boolean
{
    if (tree.current_history_uid === tree.root_history_uid)
    {
        return false;
    }

    const current_node = tree.nodes.get(tree.current_history_uid)!;
    if (current_node.parent_history_uid === null)
    {
        return false;
    }

    for (let i = current_node.operations.length - 1; i >= 0; i--)
    {
        current_node.operations[i].inverse(sp);
    }

    tree.current_history_uid = current_node.parent_history_uid;
    return true;
}

export function find_prev_fork_node(tree: tree, start: uid = tree.current_history_uid): uid
{
    const start_node = tree.nodes.get(start);
    if (!start_node)
    {
        throw new Error(`start ${start} doesn't exist`);
    }
    if (start_node.parent_history_uid === null)
    {
        return start;
    }

    let curr: uid = start_node.parent_history_uid;
    while (true)
    {
        const node = tree.nodes.get(curr)!;

        if (node.children_history_uids.length > 1 || node.parent_history_uid === null)
        {
            return node.history_uid;
        }

        curr = node.parent_history_uid;
    }
}

function jump_to_ancestor(tree: tree, sp: space, target: uid): boolean
{
    const moved = tree.current_history_uid !== target;
    while (tree.current_history_uid !== target)
    {
        jump_prev_node(tree, sp);
    }
    return moved;
}

export function jump_to_prev_fork(tree: tree, sp: space): boolean
{
    let moved = false;
    while (jump_prev_node(tree, sp))
    {
        moved = true;
        const current = tree.nodes.get(tree.current_history_uid)!;
        if (current.children_history_uids.length > 1 || current.parent_history_uid === null)
        {
            break;
        }
    }
    return moved;
}

export function jump_to_root(tree: tree, sp: space): boolean
{
    return jump_to_ancestor(tree, sp, tree.root_history_uid);
}

export function jump_next_node(tree: tree, sp: space, target_child?: uid): boolean
{
    const current_node = tree.nodes.get(tree.current_history_uid)!;

    let next_history_uid: uid;
    if (target_child !== undefined)
    {
        if (!current_node.children_history_uids.includes(target_child))
        {
            return false;
        }
        next_history_uid = target_child;
    }
    else
    {
        if (current_node.children_history_uids.length !== 1)
        {
            return false;
        }
        next_history_uid = current_node.children_history_uids[0];
    }

    const next_node = tree.nodes.get(next_history_uid)!;

    for (const op of next_node.operations)
    {
        op.execute(sp);
    }
    tree.current_history_uid = next_node.history_uid;

    return true;
}

export function find_next_fork_node(tree: tree, start: uid = tree.current_history_uid): uid
{
    const start_node = tree.nodes.get(start);
    if (!start_node)
    {
        throw new Error(`start ${start} doesn't exist`);
    }

    let node = start_node;
    while (node.children_history_uids.length === 1)
    {
        node = tree.nodes.get(node.children_history_uids[0])!;
    }

    return node.history_uid;
}

function jump_to_descendant(tree: tree, sp: space, descendant: uid): boolean
{
    const forward_history_uids: uid[] = [];
    let curr: uid | null = descendant;

    while (curr !== null && curr !== tree.current_history_uid)
    {
        forward_history_uids.unshift(curr);
        curr = tree.nodes.get(curr)!.parent_history_uid;
    }

    if (curr !== tree.current_history_uid)
    {
        throw new Error('target is not a descendant of current node');
    }

    for (const next_uid of forward_history_uids)
    {
        jump_next_node(tree, sp, next_uid);
    }
    return forward_history_uids.length > 0;
}

export function jump_to_next_fork(tree: tree, sp: space): boolean
{
    let moved = false;
    while (jump_next_node(tree, sp))
    {
        moved = true;
    }
    return moved;
}

function get_parent_uid(tree: tree, history_uid: uid): uid | null
{
    const found = tree.nodes.get(history_uid);
    if (!found)
    {
        throw new Error(`History node ${history_uid} not found.`);
    }
    return found.parent_history_uid;
}

export function find_lca(tree: tree, history_uid_a: uid, history_uid_b: uid): uid
{
    const ancestors = new Set<uid>();

    let curr: uid = history_uid_a;

    while (true)
    {
        ancestors.add(curr);

        const parent_uid = get_parent_uid(tree, curr);

        if (parent_uid === null)
        {
            break;
        }

        curr = parent_uid;
    }

    curr = history_uid_b;
    while (true)
    {
        if (ancestors.has(curr))
        {
            return curr;
        }

        curr = get_parent_uid(tree, curr)!;
    }
}

export function jump_to_node(tree: tree, sp: space, target: uid): boolean
{
    if (tree.current_history_uid === target)
    {
        return false;
    }

    const lca_uid = find_lca(tree, tree.current_history_uid, target);

    jump_to_ancestor(tree, sp, lca_uid);
    jump_to_descendant(tree, sp, target);
    return true;
}