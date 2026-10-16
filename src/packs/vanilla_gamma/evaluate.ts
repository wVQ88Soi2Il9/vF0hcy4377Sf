import * as core from '@/core';
import * as world from '@/world';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import { build_graph, graph_devices, port_edge } from '@/packs/vanilla_beta';
import { ports_of } from './ports';
import { type operating_rule, check_rule, get_device_rule, get_recipe_flow } from './rule';

// 收斂判定用；求解（二分、fits）不放寬，誤差只剩浮點捨入，須遠小於此值
const TOLERANCE = 1e-9;

/**
 * vanilla 交給 recipe 的 context：最大只到 space；inputs 依 input 埠順序。
 */
export interface recipe_context
{
    space:  core.space;
    uid:    core.uid;
    inputs: core.item_stack[];
}

export function null_stack(): core.item_stack
{
    return { item_id: core.null_item_id, quantity: 0 };
}

/**
 * Kahn 拓撲排序；有環時 throw（環合法，但計算方式未定）。
 */
function topological_order(uids: core.uid[], edges: port_edge[]): core.uid[]
{
    const in_degree = new Map<core.uid, number>();
    const next = new Map<core.uid, core.uid[]>();
    for (const uid of uids)
    {
        in_degree.set(uid, 0);
        next.set(uid, []);
    }
    for (const edge of edges)
    {
        in_degree.set(edge.to_uid, in_degree.get(edge.to_uid)! + 1);
        next.get(edge.from_uid)!.push(edge.to_uid);
    }

    const queue = [...in_degree].filter(([, d]) => d === 0).map(([uid]) => uid);
    const order: core.uid[] = [];
    while (queue.length > 0)
    {
        const uid = queue.shift()!;
        order.push(uid);
        for (const to of next.get(uid)!)
        {
            const d = in_degree.get(to)! - 1;
            in_degree.set(to, d);
            if (d === 0)
            {
                queue.push(to);
            }
        }
    }

    if (order.length !== uids.length)
    {
        throw new Error('Cycle evaluation not supported yet.');
    }
    return order;
}

interface operation_result
{
    outputs:  core.item_stack[];
    consumed: number[];
}

/**
 * 在 [0, high] 中找最大的 v 使 ok(v) 成立；ok 對 v 單調（小的 v 成立）。回傳值保證成立。
 * 二分到浮點數無法再切分為止。
 */
function bisect_max(high: number, ok: (v: number) => boolean): number
{
    let low = 0;
    for (let mid = (low + high) / 2; mid > low && mid < high; mid = (low + high) / 2)
    {
        if (ok(mid))
        {
            low = mid;
        }
        else
        {
            high = mid;
        }
    }
    return low;
}

/**
 * 在 [0, high] 中找最小的 v 使 ok(v) 成立；ok 對 v 單調（大的 v 成立）且 ok(high) 成立。回傳值保證成立。
 * 二分到浮點數無法再切分為止。
 */
function bisect_min(high: number, ok: (v: number) => boolean): number
{
    if (ok(0))
    {
        return 0;
    }
    let low = 0;
    for (let mid = (low + high) / 2; mid > low && mid < high; mid = (low + high) / 2)
    {
        if (ok(mid))
        {
            high = mid;
        }
        else
        {
            low = mid;
        }
    }
    return high;
}

/**
 * 計算單一 device 的運轉點。
 * supply：上游目前的輸出（依 input 埠順序）；limits：各 output 埠的上限（下游消耗，沒接上為 ∞）。
 * 先依規則求最大可行輸出，再把消耗縮到仍維持該輸出的最小值（f 單調遞增，不必是 injective）。
 */
function operate(target_world: world.pure_world, device: core.device, supply: core.item_stack[], limits: number[]): operation_result
{
    const sp = target_world.space;
    const output_count = limits.length;
    if (device.selected_recipe_id === undefined)
    {
        return { outputs: Array.from({ length: output_count }, null_stack), consumed: supply.map(() => 0) };
    }

    const recipe = vanilla_alpha.get_recipe(target_world.catalog.registry, device.selected_recipe_id);
    const name = vanilla_alpha.format_namespaced_id(recipe);

    function evaluate(x: number[]): core.item_stack[]
    {
        const inputs = supply.map((s, j) => ({ item_id: s.item_id, quantity: x[j] }));
        const outputs = recipe.evaluate({ space: sp, uid: device.device_uid, inputs } satisfies recipe_context);
        if (outputs.length !== output_count)
        {
            throw new Error(`Recipe "${name}" returned ${outputs.length} outputs, device "${device.device_uid}" has ${output_count} output ports.`);
        }
        return outputs;
    }

    function fits(outputs: core.item_stack[]): boolean
    {
        return outputs.every((o, i) => o.quantity <= limits[i]);
    }

    // source：實際輸出 = t·f()，取最大的 t ∈ [0, 1]
    if (supply.length === 0)
    {
        const full = evaluate([]);
        let t = 1;
        full.forEach((o, i) =>
        {
            if (o.quantity > 0)
            {
                t = Math.min(t, limits[i] / o.quantity);
            }
        });
        return { outputs: full.map(o => ({ ...o, quantity: o.quantity * t })), consumed: [] };
    }

    // 覆寫值的 order 已在 select_rule 建立時檢查；recipe 宣告的預設規則在此檢查
    let rule: operating_rule = { kind: 'proportional' };
    if (supply.length >= 2)
    {
        const override = get_device_rule(device);
        if (override !== undefined)
        {
            rule = override;
        }
        else
        {
            const declared = get_recipe_flow(recipe).rule;
            if (declared === undefined)
            {
                throw new Error(`Recipe "${name}" on device "${device.device_uid}" has ${supply.length} inputs but no operating rule.`);
            }
            check_rule(declared, supply.length);
            rule = declared;
        }
    }

    const s = supply.map(st => st.quantity);
    // sink：沒有 output 時一律全收
    if (output_count === 0)
    {
        return { outputs: evaluate(s), consumed: s };
    }

    // 1. 依規則求最大可行輸出
    let x: number[];
    if (fits(evaluate(s)))
    {
        x = s;
    }
    else if (rule.kind === 'proportional')
    {
        const t = bisect_max(1, v => fits(evaluate(s.map(q => q * v))));
        x = s.map(q => q * t);
    }
    else
    {
        x = s.map(() => 0);
        for (const j of rule.order)
        {
            const trial = (v: number): number[] => x.map((q, k) => k === j ? v : q);
            x = trial(fits(evaluate(trial(s[j]))) ? s[j] : bisect_max(s[j], v => fits(evaluate(trial(v)))));
        }
    }

    // 2. 縮到仍維持該輸出的最小消耗；多餘供應反壓回上游
    const target = evaluate(x).map(o => o.quantity);
    const reaches = (y: number[]): boolean => evaluate(y).every((o, i) => o.quantity >= target[i]);
    if (rule.kind === 'proportional')
    {
        const base = x;
        const t = bisect_min(1, v => reaches(base.map(q => q * v)));
        x = base.map(q => q * t);
    }
    else
    {
        for (const j of [...rule.order].reverse())
        {
            const trial = (v: number): number[] => x.map((q, k) => k === j ? v : q);
            x = trial(bisect_min(x[j], v => reaches(trial(v))));
        }
    }

    return { outputs: evaluate(x), consumed: x };
}

function same_numbers(a: number[], b: number[]): boolean
{
    return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= TOLERANCE);
}

/**
 * 穩態流量：quantity 為每單位時間流量。依拓撲順序計算每個 device 的運轉點，
 * 各 output 埠的上限為下游上一輪的消耗（沒接上為 ∞），反覆至前後兩輪相差 ≤ 1e-9；結果只回傳，不存入 world。
 * 超過 device 數 × 2 輪未收斂、有環、輸出數量與 output 埠數不符、輸入 ≥ 2 卻沒有規則時報錯。
 * 未接上的 input 為 null item；未選 recipe 的 device 輸出 null item、不消耗；重疊或出界的 device 跳過。
 */
export function evaluate_world(target_world: world.pure_world): Map<core.uid, core.item_stack[]>
{
    const sp = target_world.space;
    const edges = build_graph(sp);
    const order = topological_order(graph_devices(sp).map(d => d.device_uid), edges);
    if (order.length === 0)
    {
        return new Map();
    }
    const max_rounds = order.length * 2;

    let results = new Map<core.uid, core.item_stack[]>();
    let consumed = new Map<core.uid, number[]>();
    for (let round = 0; round < max_rounds; round++)
    {
        const next_results = new Map<core.uid, core.item_stack[]>();
        const next_consumed = new Map<core.uid, number[]>();
        for (const uid of order)
        {
            const device = sp.devices.get(uid)!;
            const supply = ports_of(device, 'input').map(() => null_stack());
            const limits = ports_of(device, 'output').map(() => Infinity);
            for (const edge of edges)
            {
                if (edge.to_uid === uid)
                {
                    supply[edge.to_index] = next_results.get(edge.from_uid)![edge.from_index];
                }
                if (edge.from_uid === uid && consumed.has(edge.to_uid))
                {
                    limits[edge.from_index] = consumed.get(edge.to_uid)![edge.to_index];
                }
            }
            const result = operate(target_world, device, supply, limits);
            next_results.set(uid, result.outputs);
            next_consumed.set(uid, result.consumed);
        }

        const stable = round > 0 && order.every(uid =>
            same_numbers(next_consumed.get(uid)!, consumed.get(uid)!) &&
            same_numbers(next_results.get(uid)!.map(o => o.quantity), results.get(uid)!.map(o => o.quantity)));
        results = next_results;
        consumed = next_consumed;
        if (stable)
        {
            return results;
        }
    }

    throw new Error(`Flow did not converge within ${max_rounds} rounds.`);
}
