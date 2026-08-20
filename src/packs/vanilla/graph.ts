import type { game_map, pack_registry } from '@/API';
import { get_device_definition } from '@/API';
import type { device_node } from './types';
import { get_world_ports } from '@/utils/device_utils';
import { spatial_map } from '@/utils/spatial_map';

interface spatial_cell
{
    in_ports:  number[];
    out_ports: number[];
}

/**
 * Builds a directed graph of all devices on the map based on port connections.
 * 
 * Connection Logic:
 * An edge is formed from Device A to Device B if and only if
 * one of A's output ports exactly matches the coordinates of one of B's input ports.
 */
export function build_device_graph(map: game_map, registry: pack_registry): device_node[]
{
    const port_map = new spatial_map<spatial_cell>();
    const nodes_map = new Map<number, device_node>();

    // Initialize all device nodes
    for (const dev of map.devices)
    {
        nodes_map.set(dev.uid, {
            uid: dev.uid,
            previous_nodes: [],
            next_nodes: []
        });
    }

    // Phase 1: Register all world ports into the spatial map
    for (const dev of map.devices)
    {
        const def = get_device_definition(registry, dev.definition_id);
        if (!def)
        {
            continue;
        }

        const out_ports = get_world_ports(dev, def, 'output');
        for (const port of out_ports)
        {
            const cell = port_map.get_or_insert(port, () => ({ in_ports: [], out_ports: [] }));
            cell.out_ports.push(dev.uid);
        }

        const in_ports = get_world_ports(dev, def, 'input');
        for (const port of in_ports)
        {
            const cell = port_map.get_or_insert(port, () => ({ in_ports: [], out_ports: [] }));
            cell.in_ports.push(dev.uid);
        }
    }

    // Phase 2: Form edges by checking exact matches (=) in the spatial map
    for (const cell of port_map.values())
    {
        // If a cell has both out_ports (source devices) and in_ports (target devices),
        // we connect all sources to all targets.
        if (cell.out_ports.length > 0 && cell.in_ports.length > 0)
        {
            for (const source_id of cell.out_ports)
            {
                for (const target_id of cell.in_ports)
                {
                    // Prevent self-connection just in case a device points to itself
                    if (source_id !== target_id)
                    {
                        const source_node = nodes_map.get(source_id);
                        const target_node = nodes_map.get(target_id);
                        
                        if (source_node && target_node)
                        {
                            // Avoid duplicate edges if multiple ports overlap identically
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

    // Return as array format
    return Array.from(nodes_map.values());
}
