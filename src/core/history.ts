/**
 * 分支歷史樹純演算法與操作
 *
 * 遵循極致鏡像對稱與無歧義路徑原則：
 * - 向上時間流：undo / jump_to_prev_fork / jump_to_root / jump_to_ancestor
 * - 向下時間流：redo / jump_to_next_fork / jump_to_descendant
 * - 跨分支穿越：jump_to_node（由 LCA + jump_to_ancestor + jump_to_descendant 組裝）
 */
import type { uid } from './definition_i';
import type { space } from './definition_ii';
import { rev_op } from './definition_iii';

/**
 * 回傳約定：
 * - 自然邊界（根節點無法再 undo、分叉處無法自動 redo、目標不是子節點）回傳 false。
 * - jump_* 回傳 boolean：true 表示 current 節點確實改變，false 表示未移動。
 * - find_lca 收到不存在的節點 uid 時拋出例外。
 */

// ── 歷史樹資料結構 ───────────────────────────────────────────────────────────

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
 * 從歷史樹中刪除一個末端葉節點（Leaf Node）。
 * 嚴格限制：僅能刪除無子節點（children_history_uids.length === 0）的葉節點，避免破壞因果歷史連續性。
 */
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

    // 已排除根節點;delete_node 只刪葉節點,父節點必定存在
    const parent = tree.nodes.get(target.parent_history_uid)!;
    parent.children_history_uids = parent.children_history_uids.filter(id => id !== target_uid);

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

    // current 永遠存在
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

/**
 * 自 start 往上找第一個分岔點;碰到根節點則回傳根節點。
 */
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
        // 父鏈完整
        const node = tree.nodes.get(curr)!;

        if (node.children_history_uids.length > 1 || node.parent_history_uid === null)
        {
            return node.history_uid;
        }

        curr = node.parent_history_uid;
    }
}

/**
 * 沿直系祖先路徑向上跳轉（target 必須為 current 之直系祖先節點）。
 */
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
    return jump_to_ancestor(tree, sp, 0);
}

// ── 3. Downward / Forward Operators (正向向下時間流) ─────────────────────────

export function jump_next_node(tree: tree, sp: space, target_child?: uid): boolean
{
    // current 永遠存在
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

    // uid 取自 children_history_uids,必定存在
    const next_node = tree.nodes.get(next_history_uid)!;

    for (const op of next_node.operations)
    {
        op.execute(sp);
    }
    tree.current_history_uid = next_node.history_uid;

    return true;
}

/**
 * 自 start 沿唯一路徑往下找第一個分岔點;碰到葉節點則回傳葉節點。start 本身是分岔點或葉節點時回傳 start。
 */
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
        // uid 取自 children_history_uids,必定存在
        node = tree.nodes.get(node.children_history_uids[0])!;
    }

    return node.history_uid;
}

/**
 * 沿直系子孫路徑向下跳轉（當 target 為 current 之子孫節點時）。
 */
function jump_to_descendant(tree: tree, sp: space, descendant: uid): boolean
{
    const forward_history_uids: uid[] = [];
    let curr: uid | null = descendant;

    while (curr !== null && curr !== tree.current_history_uid)
    {
        forward_history_uids.unshift(curr);
        // descendant 已由 find_lca 驗證存在,delete_node 只刪葉節點,父鏈必定完整
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

/**
 * 沿當前無歧義單一路徑前進至最深處（葉節點或下一個分岔點）。
 */
export function jump_to_next_fork(tree: tree, sp: space): boolean
{
    let moved = false;
    while (jump_next_node(tree, sp))
    {
        moved = true;
    }
    return moved;
}

// ── 4. Core LCA & Target Jump (核心中樞：跨分支任意穿越) ─────────────────────

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

/**
 * 跨分支任意節點跳轉：由 LCA 拆解為「先回到 LCA，再跳至目標子孫」。
 */
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