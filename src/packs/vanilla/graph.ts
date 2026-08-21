import type { game_map, pack_registry } from '@/API';
import type { device_node, port_cell, device_graph } from './types';
import { add_vector, vector_to_string } from '@/utils/math';
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
 *
 * 額外產出 z_slice_index：
 * 在建立 port_map 的同一遍迴圈中，凡世界座標之 Z 為奇數的端口（即垂直跨層端口），
 * 同步登錄至 z_slice_index。此索引在 2× Grid 座標系下天然只含跨層連線端口，
 * 無須額外掃描，查詢跨層連通性時可直接讀取而不重算。
 */
export function build_device_graph(map: game_map, _registry?: pack_registry): device_graph
{
    const port_map     = new spatial_map<spatial_cell>();
    const nodes_map    = new Map<number, device_node>();
    const z_slice_index = new Map<string, port_cell>();

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

    // 第一階段：將所有裝置的世界連接埠註冊進 port_map
    //           同時，Z 為奇數的端口（垂直跨層）順帶登錄至 z_slice_index
    for (const dev of map.devices)
    {
        const out_ports = dev.get_port('output').map(p => add_vector(dev.position, p));
        for (const port of out_ports)
        {
            const cell = port_map.get_or_insert(port, () => ({ in_ports: [], out_ports: [] }));
            cell.out_ports.push(dev.uid);

            // 2× Grid 奇偶不變量：Z 為奇數 ⟺ 此端口為垂直跨層端口
            if (port.length >= 3 && port[2] % 2 !== 0)
            {
                const key = vector_to_string(port);
                let slice_cell = z_slice_index.get(key);
                if (!slice_cell)
                {
                    slice_cell = { in_uids: [], out_uids: [] };
                    z_slice_index.set(key, slice_cell);
                }
                slice_cell.out_uids.push(dev.uid);
            }
        }

        const in_ports = dev.get_port('input').map(p => add_vector(dev.position, p));
        for (const port of in_ports)
        {
            const cell = port_map.get_or_insert(port, () => ({ in_ports: [], out_ports: [] }));
            cell.in_ports.push(dev.uid);

            if (port.length >= 3 && port[2] % 2 !== 0)
            {
                const key = vector_to_string(port);
                let slice_cell = z_slice_index.get(key);
                if (!slice_cell)
                {
                    slice_cell = { in_uids: [], out_uids: [] };
                    z_slice_index.set(key, slice_cell);
                }
                slice_cell.in_uids.push(dev.uid);
            }
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

    return {
        nodes:         Array.from(nodes_map.values()),
        z_slice_index
    };
}
