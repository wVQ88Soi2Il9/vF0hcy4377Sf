import * as core from '@/core';
import * as graph from '@/packs/graph';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import { type combination, scale_combination } from './combination';
import { type ratio_recipe, is_ratio_recipe } from './ratio';

/** 比對兩個相對倍率是否一致時的相對容差。 */
const consistency_tolerance = 1e-9;

export interface ratio_device_result
{
    t:       number;
    inputs:  combination;
    outputs: combination;
}

export interface ratio_graph_result
{
    devices:  Map<core.uid, ratio_device_result>;
    /** 沒接上游的 input，依 device、item 加總。 */
    external: { uid: core.uid; item_id: core.namespaced_id; quantity: number }[];
}

type arrangement = core.item_stack[];

/** 一段連續的埠，存仍可能的所有葉排列。 */
interface fixed_segment
{
    kind:         'fixed';
    arrangements: arrangement[];
}

/** 平的 unordered（子項全是葉、上層全是 ordered）：不展開排列，只記每種葉的個數與每個埠的候選。 */
interface pool_segment
{
    kind:       'pool';
    /** 葉 key → 葉與個數。 */
    leaves:     Map<string, { leaf: core.item_stack; count: number }>;
    /** 每個埠仍可能的葉 key；每個候選都出現在某個完整分配中。 */
    candidates: Set<string>[];
}

type segment = fixed_segment | pool_segment;

/** 一側的埠：第 k 個埠落在哪一段的第幾個位置。 */
type side_state = { segment: segment; local: number }[];

interface device_state
{
    device:  core.device;
    recipe:  ratio_recipe;
    inputs:  side_state;
    outputs: side_state;
}

function item_key(item_id: core.namespaced_id): string
{
    return `${item_id.namespace}:${item_id.id}`;
}

function leaf_key(leaf: core.item_stack): string
{
    return `${item_key(leaf.item_id)}*${leaf.quantity}`;
}

function arrangement_key(arr: arrangement): string
{
    return arr.map(leaf_key).join('|');
}

function combination_key(comb: combination): string
{
    if (!('kind' in comb))
    {
        return leaf_key(comb);
    }
    const inner = comb.items.map(combination_key).join(',');
    return comb.kind === 'ordered' ? `[${inner}]` : `{${inner}}`;
}

/**
 * 多重集合排列：相同 key 的元素視為同一個，只產生不重複的排列。
 */
function distinct_permutations<T>(list: T[], key: (t: T) => string): T[][]
{
    const groups = new Map<string, { value: T; count: number }>();
    for (const t of list)
    {
        const k = key(t);
        const group = groups.get(k);
        if (group === undefined)
        {
            groups.set(k, { value: t, count: 1 });
        }
        else
        {
            group.count++;
        }
    }
    const result: T[][] = [];
    const current: T[] = [];
    const visit = (): void =>
    {
        if (current.length === list.length)
        {
            result.push([...current]);
            return;
        }
        for (const group of groups.values())
        {
            if (group.count === 0)
            {
                continue;
            }
            group.count--;
            current.push(group.value);
            visit();
            current.pop();
            group.count++;
        }
    };
    visit();
    return result;
}

/**
 * 所有葉排列：ordered 的子項依序，unordered 的子項任意排列（相同子項不重複排列）；去除重複。
 */
function arrangements(comb: combination): arrangement[]
{
    if (!('kind' in comb))
    {
        return [[comb]];
    }
    const child_options = comb.items.map(arrangements);
    const keys = comb.items.map(combination_key);
    const indices = comb.items.map((_, k) => k);
    const index_orders = comb.kind === 'ordered' ? [indices] : distinct_permutations(indices, k => keys[k]);
    const orders = index_orders.map(order => order.map(k => child_options[k]));
    const result = new Map<string, arrangement>();
    for (const order of orders)
    {
        let partial: arrangement[] = [[]];
        for (const options of order)
        {
            partial = partial.flatMap(prefix => options.map(opt => [...prefix, ...opt]));
        }
        for (const arr of partial)
        {
            result.set(arrangement_key(arr), arr);
        }
    }
    return [...result.values()];
}

function is_flat_unordered(comb: combination): comb is { kind: 'unordered'; items: core.item_stack[] }
{
    return 'kind' in comb && comb.kind === 'unordered' && comb.items.length > 0 && comb.items.every(c => !('kind' in c));
}

/**
 * 依 ordered 切段：平的 unordered 成為 pool，其他（葉、非平的 unordered）展開排列成為 fixed。
 */
function build_side(comb: combination): side_state
{
    const side: side_state = [];
    const push = (segment: segment, length: number): void =>
    {
        for (let local = 0; local < length; local++)
        {
            side.push({ segment, local });
        }
    };
    const visit = (c: combination): void =>
    {
        if ('kind' in c && c.kind === 'ordered')
        {
            c.items.forEach(visit);
            return;
        }
        if (is_flat_unordered(c))
        {
            const leaves = new Map<string, { leaf: core.item_stack; count: number }>();
            for (const leaf of c.items)
            {
                const key = leaf_key(leaf);
                const entry = leaves.get(key) ?? { leaf, count: 0 };
                entry.count++;
                leaves.set(key, entry);
            }
            push({ kind: 'pool', leaves, candidates: c.items.map(() => new Set(leaves.keys())) }, c.items.length);
            return;
        }
        const arrs = arrangements(c);
        push({ kind: 'fixed', arrangements: arrs }, arrs[0].length);
    };
    visit(comb);
    return side;
}

/**
 * 埠與葉的二分匹配：先找一個完整分配，再只留下出現在某個完整分配中的候選；沒有完整分配時回傳 false。
 * 埠 i 目前分到葉 ρ，候選 τ 可行 ⇔ 從 τ 沿「葉 → 分到它的埠 → 該埠的候選」走得到 ρ（交錯環）。
 */
function prune_pool(pool: pool_segment): boolean
{
    const assigned: string[] = [];
    const holders = new Map<string, number[]>([...pool.leaves.keys()].map(key => [key, []]));
    const augment = (port: number, visited: Set<string>): boolean =>
    {
        for (const key of pool.candidates[port])
        {
            if (visited.has(key))
            {
                continue;
            }
            visited.add(key);
            const ports = holders.get(key)!;
            if (ports.length < pool.leaves.get(key)!.count)
            {
                ports.push(port);
                assigned[port] = key;
                return true;
            }
            for (let k = 0; k < ports.length; k++)
            {
                if (augment(ports[k], visited))
                {
                    ports[k] = port;
                    assigned[port] = key;
                    return true;
                }
            }
        }
        return false;
    };
    for (let port = 0; port < pool.candidates.length; port++)
    {
        if (!augment(port, new Set()))
        {
            return false;
        }
    }

    const reach = new Map<string, Set<string>>();
    const reachable = (from: string): Set<string> =>
    {
        const cached = reach.get(from);
        if (cached !== undefined)
        {
            return cached;
        }
        const seen = new Set([from]);
        const stack = [from];
        while (stack.length > 0)
        {
            for (const port of holders.get(stack.pop()!)!)
            {
                for (const next of pool.candidates[port])
                {
                    if (!seen.has(next))
                    {
                        seen.add(next);
                        stack.push(next);
                    }
                }
            }
        }
        reach.set(from, seen);
        return seen;
    };
    pool.candidates = pool.candidates.map((keys, port) => new Set([...keys].filter(key => reachable(key).has(assigned[port]))));
    return true;
}

/** 該埠仍可能的葉，依葉 key 去重。 */
function leaves_at(side: side_state, index: number): Map<string, core.item_stack>
{
    const { segment, local } = side[index];
    const result = new Map<string, core.item_stack>();
    if (segment.kind === 'fixed')
    {
        for (const arr of segment.arrangements)
        {
            result.set(leaf_key(arr[local]), arr[local]);
        }
    }
    else
    {
        for (const key of segment.candidates[local])
        {
            result.set(key, segment.leaves.get(key)!.leaf);
        }
    }
    return result;
}

function items_at(side: side_state, index: number): Set<string>
{
    return new Set([...leaves_at(side, index).values()].map(leaf => item_key(leaf.item_id)));
}

/**
 * 該埠只留下 item 在 allowed 中的可能；回傳是否有變動，沒有可能時回傳 null。
 */
function restrict(side: side_state, index: number, allowed: Set<string>): boolean | null
{
    const { segment, local } = side[index];
    if (segment.kind === 'fixed')
    {
        const kept = segment.arrangements.filter(arr => allowed.has(item_key(arr[local].item_id)));
        if (kept.length === 0)
        {
            return null;
        }
        const changed = kept.length !== segment.arrangements.length;
        segment.arrangements = kept;
        return changed;
    }
    const before = segment.candidates[local];
    const kept = new Set([...before].filter(key => allowed.has(item_key(segment.leaves.get(key)!.leaf.item_id))));
    if (kept.size === before.size)
    {
        return false;
    }
    segment.candidates[local] = kept;
    return prune_pool(segment) ? true : null;
}

function count_leaves(comb: combination): number
{
    return 'kind' in comb ? comb.items.reduce((sum, item) => sum + count_leaves(item), 0) : 1;
}

function port_count(device: core.device, direction: core.port_direction): number
{
    return device.get_port().filter(p => p.direction === direction).length;
}

function load_state(registry: core.pack_registry, device: core.device): device_state
{
    const name = `device "${device.device_uid}"`;
    if (device.selected_recipe_id === undefined)
    {
        throw new Error(`evaluate_ratio_graph: ${name} has no selected recipe.`);
    }
    const recipe = vanilla_alpha.get_recipe(registry, device.selected_recipe_id);
    if (!is_ratio_recipe(recipe))
    {
        throw new Error(`evaluate_ratio_graph: ${name} selects "${item_key(recipe)}", which is not a ratio recipe.`);
    }
    for (const [side, comb, direction] of [['inputs', recipe.inputs, 'input'], ['outputs', recipe.outputs, 'output']] as const)
    {
        const leaves = count_leaves(comb);
        const ports = port_count(device, direction);
        if (leaves !== ports)
        {
            throw new Error(`evaluate_ratio_graph: ${name} recipe "${item_key(recipe)}" has ${leaves} ${side} but the device has ${ports} ${direction} ports.`);
        }
    }
    return { device, recipe, inputs: build_side(recipe.inputs), outputs: build_side(recipe.outputs) };
}

/**
 * 兩端 item 須相同：反覆刪去與另一端不相容的可能，直到不再變動。
 */
function match_items(states: Map<core.uid, device_state>, edges: graph.port_edge[]): void
{
    let changed = true;
    while (changed)
    {
        changed = false;
        for (const e of edges)
        {
            const from = states.get(e.from_uid)!.outputs;
            const to = states.get(e.to_uid)!.inputs;
            const from_items = items_at(from, e.from_index);
            const to_items = items_at(to, e.to_index);
            const from_changed = restrict(from, e.from_index, to_items);
            const to_changed = restrict(to, e.to_index, from_items);
            if (from_changed === null || to_changed === null)
            {
                throw new Error(`evaluate_ratio_graph: item mismatch on edge "${e.from_uid}" output ${e.from_index} -> "${e.to_uid}" input ${e.to_index}.`);
            }
            if (from_changed || to_changed)
            {
                changed = true;
            }
        }
    }
}

/**
 * 該埠的可能須為同一 item、同一係數，否則無法唯一決定。
 */
function unique_leaf(side: side_state, index: number, where: string): core.item_stack
{
    const leaves = leaves_at(side, index);
    if (leaves.size !== 1)
    {
        throw new Error(`evaluate_ratio_graph: ${where} is ambiguous (${[...leaves.keys()].join(', ')}).`);
    }
    return [...leaves.values()][0];
}

/**
 * 沒接上游的 input 依 item 加總。已接的埠唯一，所以 fixed 段任取一個排列、pool 段扣掉已接的葉，結果都固定。
 */
function external_inputs(side: side_state, connected: Set<number>, t: number): Map<string, { item_id: core.namespaced_id; quantity: number }>
{
    const used = new Map<segment, Map<string, number>>();
    side.forEach(({ segment }, index) =>
    {
        if (segment.kind === 'pool' && connected.has(index))
        {
            const key = leaf_key(unique_leaf(side, index, `input ${index}`));
            const counts = used.get(segment) ?? new Map<string, number>();
            counts.set(key, (counts.get(key) ?? 0) + 1);
            used.set(segment, counts);
        }
    });
    const totals = new Map<string, { item_id: core.namespaced_id; quantity: number }>();
    const add = (leaf: core.item_stack, count: number): void =>
    {
        const key = item_key(leaf.item_id);
        const entry = totals.get(key) ?? { item_id: { ...leaf.item_id }, quantity: 0 };
        entry.quantity += t * leaf.quantity * count;
        totals.set(key, entry);
    };
    side.forEach(({ segment, local }, index) =>
    {
        if (segment.kind === 'fixed')
        {
            if (!connected.has(index))
            {
                add(segment.arrangements[0][local], 1);
            }
        }
        else if (local === 0)
        {
            for (const [key, { leaf, count }] of segment.leaves)
            {
                const remaining = count - (used.get(segment)?.get(key) ?? 0);
                if (remaining > 0)
                {
                    add(leaf, remaining);
                }
            }
        }
    });
    return totals;
}

/**
 * 限定 ratio recipe 的穩態：每條邊供需相等（t_from·a = t_to·b），沒有多餘產出。
 * 每個弱連通部分以相對倍率 r 表示，t = s·r，s = min(upper_bound / r)，可為 Infinity；
 * 比例對不上（不分方向的迴路）時該部分 t = 0。沒接上游的 input 列為外部需求。
 * 埠依 get_port() 中同方向的順序對應展開後的葉；unordered 依邊另一端的 item 配對。
 */
export function evaluate_ratio_graph(sp: core.space, registry: core.pack_registry): ratio_graph_result
{
    if (!graph.is_dag(sp))
    {
        throw new Error('evaluate_ratio_graph: graph has a cycle.');
    }
    const states = new Map<core.uid, device_state>();
    for (const device of graph.graph_devices(sp))
    {
        states.set(device.device_uid, load_state(registry, device));
    }
    const edges = graph.build_graph(sp);
    match_items(states, edges);

    const neighbors = new Map<core.uid, { other: core.uid; factor: number }[]>();
    for (const uid of states.keys())
    {
        neighbors.set(uid, []);
    }
    const connected_inputs = new Map<core.uid, Set<number>>();
    for (const e of edges)
    {
        const a = unique_leaf(states.get(e.from_uid)!.outputs, e.from_index, `"${e.from_uid}" output ${e.from_index}`).quantity;
        const b = unique_leaf(states.get(e.to_uid)!.inputs, e.to_index, `"${e.to_uid}" input ${e.to_index}`).quantity;
        // r_to = r_from·a / b
        neighbors.get(e.from_uid)!.push({ other: e.to_uid, factor: a / b });
        neighbors.get(e.to_uid)!.push({ other: e.from_uid, factor: b / a });
        if (!connected_inputs.has(e.to_uid))
        {
            connected_inputs.set(e.to_uid, new Set());
        }
        connected_inputs.get(e.to_uid)!.add(e.to_index);
    }

    const t_of = new Map<core.uid, number>();
    for (const start of states.keys())
    {
        if (t_of.has(start))
        {
            continue;
        }
        const r = new Map<core.uid, number>([[start, 1]]);
        const queue = [start];
        let consistent = true;
        while (queue.length > 0)
        {
            const uid = queue.shift()!;
            for (const { other, factor } of neighbors.get(uid)!)
            {
                const expected = r.get(uid)! * factor;
                const known = r.get(other);
                if (known === undefined)
                {
                    r.set(other, expected);
                    queue.push(other);
                }
                else if (Math.abs(known - expected) > consistency_tolerance * Math.max(known, expected))
                {
                    consistent = false;
                }
            }
        }
        let s = Infinity;
        for (const [uid, ratio] of r)
        {
            s = Math.min(s, states.get(uid)!.recipe.upper_bound / ratio);
        }
        if (!consistent)
        {
            s = 0;
        }
        for (const [uid, ratio] of r)
        {
            t_of.set(uid, s * ratio);
        }
    }

    const result: ratio_graph_result = { devices: new Map(), external: [] };
    for (const [uid, state] of states)
    {
        const t = t_of.get(uid)!;
        result.devices.set(uid, { t, inputs: scale_combination(state.recipe.inputs, t), outputs: scale_combination(state.recipe.outputs, t) });
        for (const entry of external_inputs(state.inputs, connected_inputs.get(uid) ?? new Set<number>(), t).values())
        {
            result.external.push({ uid, ...entry });
        }
    }
    return result;
}
