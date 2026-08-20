import type { game_map, pack_registry } from '@/API';
import type { device_node } from './types';
import { add_vector } from '@/utils/math';
import { spatial_map } from '@/utils/spatial_map';

interface spatial_cell
{
    in_ports:  number[];
    out_ports: number[];
}

/**
 * 依據連接埠在世界空間中的重合位置，建構地圖上所有裝置的有向連接圖。
 *
 * 連接規則：
 * 當且僅當裝置 A 的任一 output 連接埠世界座標與裝置 B 的任一 input 連接埠世界座標完全重合時，
 * 建立 A -> B 的有向連接邊。
 */
export function build_device_graph(map: game_map, _registry?: pack_registry): device_node[]
{
    const port_map = new spatial_map<spatial_cell>();
    const nodes_map = new Map<number, device_node>();

    // 初始化所有裝置節點
    for (const dev of map.devices)
    {
        nodes_map.set(dev.uid,
        {
            uid:            dev.uid,
            previous_nodes: [],
            next_nodes:     []
        });
    }

    // 第一階段：將所有裝置的世界連接埠註冊進 spatial_map
    for (const dev of map.devices)
    {
        const out_ports = dev.get_port('output').map(p => add_vector(dev.position, p));
        for (const port of out_ports)
        {
            const cell = port_map.get_or_insert(port, () => ({ in_ports: [], out_ports: [] }));
            cell.out_ports.push(dev.uid);
        }

        const in_ports = dev.get_port('input').map(p => add_vector(dev.position, p));
        for (const port of in_ports)
        {
            const cell = port_map.get_or_insert(port, () => ({ in_ports: [], out_ports: [] }));
            cell.in_ports.push(dev.uid);
        }
    }

    // 第二階段：檢查空間網格中重合的輸出與輸入連接埠，建立連線
    for (const cell of port_map.values())
    {
        if (cell.out_ports.length > 0 && cell.in_ports.length > 0)
        {
            for (const source_id of cell.out_ports)
            {
                for (const target_id of cell.in_ports)
                {
                    if (source_id !== target_id)
                    {
                        const source_node = nodes_map.get(source_id);
                        const target_node = nodes_map.get(target_id);

                        if (source_node && target_node)
                        {
                            if (!source_node.next_nodes.includes(target_id))
                            {
                                source_node.next_nodes.push(target_id);
                            }
                            if (!target_node.previous_nodes.includes(source_id))
                            {
                                target_node.previous_nodes.push(source_id);
                            }
                        }
                    }
                }
            }
        }
    }

    return Array.from(nodes_map.values());
}
