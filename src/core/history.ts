/**
 * src/core/history.ts — Non-linear undo tree algorithms and operations
 *
 * Follows mirror symmetry and unambiguous path navigation:
 * - Upward time flow: undo / jump_to_prev_fork / jump_to_root / jump_to_ancestor
 * - Downward time flow: redo / jump_to_next_fork / jump_to_descendant
 * - Cross-branch navigation: jump_to_node (composed via LCA + jump_to_ancestor + jump_to_descendant)
 */
import type { uid } from './definition_i';
import type { space } from './definition_ii';
import { rev_op } from './definition_iii';

// ── History Tree Data Structures ───────────────────────────────────────────

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
    current_history_uid: uid;
    next_history_uid:    uid;
}

// ── 1. Elementary Operators ────────────────────────────────────────────────

export function create_tree(): tree
{
    const root_node: node =
    {
        history_uid:           0,
        parent_history_uid:    null,
        children_history_uids: [],
        operations:            []
    };

    return {
        nodes:               new Map([[0, root_node]]),
        current_history_uid: 0,
        next_history_uid:    1
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
    for (const op of operations)
    {
        op.execute(sp);
    }

    const new_node: node =
    {
        history_uid:           tree.next_history_uid,
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
    tree.next_history_uid += 1;

    return new_node;
}

/**
 * Deletes a leaf node from the history tree.
 * Strict constraint: only nodes without children (children_history_uids.length === 0)
 * can be deleted to maintain causal continuity.
 */
export function delete_node(tree: tree, target_uid: uid): boolean
{
    const target = tree.nodes.get(target_uid);
    if (!target || target_uid === tree.current_history_uid || target.children_history_uids.length > 0 || target.parent_history_uid === null)
    {
        return false;
    }

    const parent = tree.nodes.get(target.parent_history_uid);
    if (parent)
    {
        parent.children_history_uids = parent.children_history_uids.filter(id => id !== target_uid);
    }

    tree.nodes.delete(target_uid);
    return true;
}

// ── 2. Upward / Backward Operators ─────────────────────────────────────────

export function jump_prev_node(tree: tree, sp: space): boolean
{
    if (tree.current_history_uid === 0)
    {
        return false;
    }

    const current_node = tree.nodes.get(tree.current_history_uid);
    if (!current_node || current_node.parent_history_uid === null)
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

export function find_prev_fork_node(tree: tree, start: uid = tree.current_history_uid): uid | null
{
    const start_node = tree.nodes.get(start);
    if (!start_node || start_node.parent_history_uid === null)
    {
        return null;
    }

    let curr: uid | null = start_node.parent_history_uid;
    while (curr !== null)
    {
        const node = tree.nodes.get(curr);
        if (!node)
        {
            break;
        }

        if (node.children_history_uids.length > 1)
        {
            return node.history_uid;
        }

        curr = node.parent_history_uid;
    }

    return null;
}

/**
 * Jumps upward along direct ancestor line (target must be an ancestor of current node).
 */
export function jump_to_ancestor(tree: tree, sp: space, target: uid): void
{
    while (tree.current_history_uid !== target)
    {
        jump_prev_node(tree, sp);
    }
}

export function jump_to_prev_fork(tree: tree, sp: space): void
{
    while (jump_prev_node(tree, sp))
    {
        const current = tree.nodes.get(tree.current_history_uid)!;
        if (current.children_history_uids.length > 1 || current.parent_history_uid === null)
        {
            break;
        }
    }
}

export function jump_to_root(tree: tree, sp: space): void
{
    jump_to_ancestor(tree, sp, 0);
}

// ── 3. Downward / Forward Operators ────────────────────────────────────────

export function jump_next_node(tree: tree, sp: space, target_child?: uid): boolean
{
    const current_node = tree.nodes.get(tree.current_history_uid);
    if (!current_node)
    {
        return false;
    }

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

    const next_node = tree.nodes.get(next_history_uid);
    if (!next_node)
    {
        return false;
    }

    for (const op of next_node.operations)
    {
        op.execute(sp);
    }
    tree.current_history_uid = next_node.history_uid;

    return true;
}

export function find_next_fork_node(tree: tree, start: uid = tree.current_history_uid): uid | null
{
    const start_node = tree.nodes.get(start);
    if (!start_node || start_node.children_history_uids.length !== 1)
    {
        return null;
    }

    let curr: uid = start_node.children_history_uids[0];
    while (true)
    {
        const node = tree.nodes.get(curr);
        if (!node)
        {
            break;
        }

        if (node.children_history_uids.length > 1)
        {
            return node.history_uid;
        }

        if (node.children_history_uids.length === 0)
        {
            break;
        }

        curr = node.children_history_uids[0];
    }

    return null;
}

/**
 * Jumps downward along direct descendant line (target must be a descendant of current node).
 */
export function jump_to_descendant(tree: tree, sp: space, descendant: uid): void
{
    const forward_history_uids: uid[] = [];
    let curr: uid | null = descendant;

    while (curr !== null && curr !== tree.current_history_uid)
    {
        forward_history_uids.unshift(curr);
        curr = tree.nodes.get(curr)?.parent_history_uid ?? null;
    }

    if (curr !== tree.current_history_uid)
    {
        throw new Error('target is not a descendant of current node');
    }

    for (const next_uid of forward_history_uids)
    {
        jump_next_node(tree, sp, next_uid);
    }
}

/**
 * Advances along current unambiguous path to the furthest node (leaf or next fork).
 */
export function jump_to_next_fork(tree: tree, sp: space): void
{
    while (jump_next_node(tree, sp))
    {
    }
}

// ── 4. Core LCA & Target Jump ──────────────────────────────────────────────

export function find_lca(tree: tree, history_uid_a: uid, history_uid_b: uid): uid
{
    const ancestors = new Set<uid>();

    let curr: uid = history_uid_a;

    while (true)
    {
        ancestors.add(curr);

        const parent_uid = tree.nodes.get(curr)!.parent_history_uid;

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

        curr = tree.nodes.get(curr)!.parent_history_uid!;
    }
}

/**
 * Cross-branch jump: decomposed via LCA into "jump to LCA, then jump to target descendant".
 */
export function jump_to_node(tree: tree, sp: space, target: uid): void
{
    if (tree.current_history_uid === target)
    {
        return;
    }

    const lca_uid = find_lca(tree, tree.current_history_uid, target);

    jump_to_ancestor(tree, sp, lca_uid);
    jump_to_descendant(tree, sp, target);
}