/**
 * src/core_v3/history.ts — 分支歷史樹純演算法與操作
 *
 * 遵循極致鏡像對稱與無歧義路徑原則：
 * - 向上時間流：undo / jump_to_prev_fork / jump_to_root / jump_to_ancestor
 * - 向下時間流：redo / jump_to_next_fork / jump_to_descendant
 * - 跨分支穿越：jump_to_node（由 LCA + jump_to_ancestor + jump_to_descendant 組裝）
 */
import type { uid } from './definition_i';
import type { space } from './definition_ii';
import { reversible_operation } from './definition_iii';

// ── 歷史樹資料結構 ───────────────────────────────────────────────────────────

export interface node
{
    history_uid:           uid;
    parent_history_uid:    uid | null;
    children_history_uids: uid[];
    operations:            reversible_operation[];
    other_info?:           Record<string, unknown>;
}

export interface tree
{
    nodes:               Map<uid, node>;
    current_history_uid: uid;
    next_history_uid:    uid;
}

// ── 1. Elementary Operators (基礎原子操作) ───────────────────────────────────

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
    operations:  reversible_operation[],
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
 * 從歷史樹中刪除一個末端葉節點（Leaf Node）。
 * 嚴格限制：僅能刪除無子節點（children_history_uids.length === 0）的葉節點，避免破壞因果歷史連續性。
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

// ── 2. Upward / Backward Operators (逆向向上時間流) ──────────────────────────

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
 * 沿直系祖先路徑向上跳轉（當 target 為 current 之祖先節點時）。
 * you MUST ensure it REALLY is
 */
export function jump_to_ancestor(tree: tree, sp: space, target: uid): void
{
    while (tree.current_history_uid !== target)
    { jump_prev_node(tree, sp) }
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

// ── 3. Downward / Forward Operators (正向向下時間流) ─────────────────────────

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
 * 沿直系子孫路徑向下跳轉（當 target 為 current 之子孫節點時）。
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
 * 沿當前無歧義單一路徑前進至最深處（葉節點或下一個分岔點）。
 */
export function jump_to_next_fork(tree: tree, sp: space): void
{
    while (jump_next_node(tree, sp)){}
}

// ── 4. Core LCA & Target Jump (核心中樞：跨分支任意穿越) ─────────────────────

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
 * 跨分支任意節點跳轉：由 LCA 拆解為「先回到 LCA，再跳至目標子孫」。
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