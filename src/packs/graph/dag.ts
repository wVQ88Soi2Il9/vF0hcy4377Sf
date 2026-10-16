import * as core from '@/core';
import { build_graph, graph_devices } from './graph';

/**
 * Kahn 拓撲排序，圖取自 graph_devices、build_graph；有環時回傳 null。
 */
function kahn_order(sp: core.space): core.uid[] | null
{
    const uids = graph_devices(sp).map(d => d.device_uid);
    const in_degree = new Map<core.uid, number>();
    const next = new Map<core.uid, core.uid[]>();
    for (const uid of uids)
    {
        in_degree.set(uid, 0);
        next.set(uid, []);
    }
    for (const edge of build_graph(sp))
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
    return order.length === uids.length ? order : null;
}

export function is_dag(sp: core.space): boolean
{
    return kahn_order(sp) !== null;
}

/**
 * 計入圖的 device 的拓撲順序；有環時報錯。
 */
export function topological_order(sp: core.space): core.uid[]
{
    const order = kahn_order(sp);
    if (order === null)
    {
        throw new Error('Graph has a cycle.');
    }
    return order;
}
