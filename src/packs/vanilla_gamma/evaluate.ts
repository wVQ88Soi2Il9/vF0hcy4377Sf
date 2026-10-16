import * as core from '@/core';
import * as world from '@/world';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import { build_graph, graph_devices, port_edge } from '@/packs/vanilla_beta';

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
 * bidirectional 埠不列入：方向由 recipe 決定，尚未定案。
 */
function ports_of(device: core.device, direction: core.port_direction): core.port[]
{
    return device.get_port().filter(p => p.direction === direction);
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

/**
 * 依拓撲順序計算每個 device 的輸出；結果只回傳，不存入 world。
 * 未接上的 input 與未選 recipe 的 output 皆為 null item；重疊或出界的 device 跳過。
 */
export function evaluate_world(target_world: world.pure_world): Map<core.uid, core.item_stack[]>
{
    const sp = target_world.space;
    const edges = build_graph(sp);
    const results = new Map<core.uid, core.item_stack[]>();

    for (const uid of topological_order(graph_devices(sp).map(d => d.device_uid), edges))
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
