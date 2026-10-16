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

interface device_state
{
    device:  core.device;
    recipe:  ratio_recipe;
    /** 仍可能的葉排列；第 k 個葉對應該側第 k 個埠。 */
    inputs:  arrangement[];
    outputs: arrangement[];
}

function item_key(item_id: core.namespaced_id): string
{
    return `${item_id.namespace}:${item_id.id}`;
}

function arrangement_key(arr: arrangement): string
{
    return arr.map(s => `${item_key(s.item_id)}*${s.quantity}`).join('|');
}

function combination_key(comb: combination): string
{
    if (!('kind' in comb))
    {
        return `${item_key(comb.item_id)}*${comb.quantity}`;
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
    const inputs = arrangements(recipe.inputs);
    const outputs = arrangements(recipe.outputs);
    for (const [side, arrs, direction] of [['inputs', inputs, 'input'], ['outputs', outputs, 'output']] as const)
    {
        const ports = port_count(device, direction);
        if (arrs[0].length !== ports)
        {
            throw new Error(`evaluate_ratio_graph: ${name} recipe "${item_key(recipe)}" has ${arrs[0].length} ${side} but the device has ${ports} ${direction} ports.`);
        }
    }
    return { device, recipe, inputs, outputs };
}

function items_at(arrs: arrangement[], index: number): Set<string>
{
    return new Set(arrs.map(arr => item_key(arr[index].item_id)));
}

/**
 * 兩端 item 須相同：反覆刪去與另一端不相容的排列，直到不再變動。
 */
function match_items(states: Map<core.uid, device_state>, edges: graph.port_edge[]): void
{
    let changed = true;
    while (changed)
    {
        changed = false;
        for (const e of edges)
        {
            const from = states.get(e.from_uid)!;
            const to = states.get(e.to_uid)!;
            const from_items = items_at(from.outputs, e.from_index);
            const to_items = items_at(to.inputs, e.to_index);
            const outputs = from.outputs.filter(arr => to_items.has(item_key(arr[e.from_index].item_id)));
            const inputs = to.inputs.filter(arr => from_items.has(item_key(arr[e.to_index].item_id)));
            if (outputs.length === 0 || inputs.length === 0)
            {
                throw new Error(`evaluate_ratio_graph: item mismatch on edge "${e.from_uid}" output ${e.from_index} -> "${e.to_uid}" input ${e.to_index}.`);
            }
            if (outputs.length !== from.outputs.length || inputs.length !== to.inputs.length)
            {
                changed = true;
            }
            from.outputs = outputs;
            to.inputs = inputs;
        }
    }
}

/**
 * 該埠在所有剩餘排列中須為同一 item、同一係數，否則無法唯一決定。
 */
function unique_coefficient(arrs: arrangement[], index: number, where: string): number
{
    const keys = new Set(arrs.map(arr => `${item_key(arr[index].item_id)}*${arr[index].quantity}`));
    if (keys.size !== 1)
    {
        throw new Error(`evaluate_ratio_graph: ${where} is ambiguous (${[...keys].join(', ')}).`);
    }
    return arrs[0][index].quantity;
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
        const a = unique_coefficient(states.get(e.from_uid)!.outputs, e.from_index, `"${e.from_uid}" output ${e.from_index}`);
        const b = unique_coefficient(states.get(e.to_uid)!.inputs, e.to_index, `"${e.to_uid}" input ${e.to_index}`);
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

        // 已接上游的埠在剩餘排列中唯一，未接的葉之多重集合因此固定，取任一排列加總即可
        const connected = connected_inputs.get(uid) ?? new Set<number>();
        const totals = new Map<string, { item_id: core.namespaced_id; quantity: number }>();
        state.inputs[0].forEach((leaf, index) =>
        {
            if (connected.has(index))
            {
                return;
            }
            const key = item_key(leaf.item_id);
            const entry = totals.get(key) ?? { item_id: { ...leaf.item_id }, quantity: 0 };
            entry.quantity += t * leaf.quantity;
            totals.set(key, entry);
        });
        for (const entry of totals.values())
        {
            result.external.push({ uid, ...entry });
        }
    }
    return result;
}
