import * as core from '@/core';
import { add_vector, vector_to_string, check_map_overlap } from '@/packs/vanilla_beta';

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

function global_port_key(device: core.device, port: core.port): string
{
    return vector_to_string(add_vector(device.position, port.offset));
}

/**
 * 計入圖的 device：重疊或出界的 device 不計入圖、不計算、不出現在結果中。
 */
export function graph_devices(sp: core.space): core.device[]
{
    const { out_of_bounds, overlapped } = check_map_overlap(sp);
    const skipped = new Set([...out_of_bounds, ...overlapped]);
    return [...sp.devices.values()].filter(d => !skipped.has(d.device_uid));
}

interface placed_port
{
    uid:       core.uid;
    direction: core.port_direction;
    index:     number;
}

/**
 * 從 space 現建圖。one position one port：同一全域座標恰有 1 個 output 與 1 個 input 時連一條邊；
 * 其他組合（同向、3 個以上、含 bidirectional）的座標不計入圖。重疊或出界的 device 也不計入圖。
 */
export function build_graph(sp: core.space): port_edge[]
{
    const by_position = new Map<string, placed_port[]>();
    for (const device of graph_devices(sp))
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
