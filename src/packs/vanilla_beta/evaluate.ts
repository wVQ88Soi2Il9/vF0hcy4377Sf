import * as core from '@/core';
import * as world from '@/world';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import { add_vector, vector_to_string } from './spatial';

/**
 * vanilla 交給 recipe 的 context：最大只到 space；inputs 依 input 埠順序。
 */
export interface recipe_context
{
    space:  core.space;
    uid:    core.uid;
    inputs: core.item_stack[];
}

/**
 * 一條邊：from 的第 from_index 個 output 埠接到 to 的第 to_index 個 input 埠。
 */
export interface port_edge
{
    from_uid:   core.uid;
    from_index: number;
    to_uid:     core.uid;
    to_index:   number;
}

export function null_stack(): core.item_stack
{
    return { item_id: core.null_item_id, quantity: 0 };
}

/**
 * bidirectional 埠不列入：方向由 recipe 決定，尚未定案。
 */
function ports_of(device: core.device, direction: core.port_direction): core.port[]
{
    return device.get_port().filter(p => p.direction === direction);
}

function global_port_key(device: core.device, port: core.port): string
{
    return vector_to_string(add_vector(device.position, port.offset));
}

interface placed_port
{
    uid:       core.uid;
    direction: core.port_direction;
    index:     number;
}

/**
 * 從 space 現建圖。one position one port：同一全域座標恰有 1 個 output 與 1 個 input 時連一條邊；
 * 其他組合（同向、3 個以上、含 bidirectional）的座標不計入圖。
 */
export function build_graph(sp: core.space): port_edge[]
{
    const by_position = new Map<string, placed_port[]>();
    for (const device of sp.devices.values())
    {
        const counters: Record<core.port_direction, number> = { input: 0, output: 0, bidirectional: 0 };
        for (const port of device.get_port())
        {
            const key = global_port_key(device, port);
            if (!by_position.has(key))
            {
                by_position.set(key, []);
            }
            by_position.get(key)!.push({ uid: device.device_uid, direction: port.direction, index: counters[port.direction]++ });
        }
    }

    const edges: port_edge[] = [];
    for (const ports of by_position.values())
    {
        const output = ports.find(p => p.direction === 'output');
        const input = ports.find(p => p.direction === 'input');
        if (ports.length === 2 && output && input)
        {
            edges.push({ from_uid: output.uid, from_index: output.index, to_uid: input.uid, to_index: input.index });
        }
    }
    return edges;
}

/**
 * Kahn 拓撲排序；有環時 throw（環合法，但計算方式未定）。
 */
function topological_order(sp: core.space, edges: port_edge[]): core.uid[]
{
    const in_degree = new Map<core.uid, number>();
    const next = new Map<core.uid, core.uid[]>();
    for (const uid of sp.devices.keys())
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

    if (order.length !== sp.devices.size)
    {
        throw new Error('Cycle evaluation not supported yet.');
    }
    return order;
}

/**
 * 依拓撲順序計算每個 device 的輸出；結果只回傳，不存入 world。
 * 未接上的 input 與未選 recipe 的 output 皆為 null item。
 */
export function evaluate_world(target_world: world.pure_world): Map<core.uid, core.item_stack[]>
{
    const sp = target_world.space;
    const edges = build_graph(sp);
    const results = new Map<core.uid, core.item_stack[]>();

    for (const uid of topological_order(sp, edges))
    {
        const device = sp.devices.get(uid)!;
        const inputs = ports_of(device, 'input').map(() => null_stack());
        for (const edge of edges)
        {
            if (edge.to_uid === uid)
            {
                inputs[edge.to_index] = results.get(edge.from_uid)![edge.from_index];
            }
        }

        const output_count = ports_of(device, 'output').length;
        if (device.selected_recipe_id === undefined)
        {
            results.set(uid, Array.from({ length: output_count }, null_stack));
            continue;
        }

        const recipe = vanilla_alpha.get_recipe(target_world.catalog.registry, device.selected_recipe_id);
        const context: recipe_context = { space: sp, uid, inputs };
        const outputs = recipe.evaluate(context);
        if (outputs.length !== output_count)
        {
            throw new Error(`Recipe "${vanilla_alpha.format_namespaced_id(recipe)}" returned ${outputs.length} outputs, device "${uid}" has ${output_count} output ports.`);
        }
        results.set(uid, outputs);
    }

    return results;
}
