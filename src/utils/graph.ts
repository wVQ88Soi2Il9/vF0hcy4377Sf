import type { game_map, device_definition } from '../core/types'
import { get_world_ports } from './device_utils'
import { vector_to_string } from './math'

export interface graph_node
{
    device_id: number
    /** List of target device_ids connected from this device's output ports */
    next_nodes: number[]
    /** List of source device_ids connected to this device's input ports */
    prev_nodes: number[]
}

export type device_graph = Map<number, graph_node>

/**
 * Builds a directed graph representing the connections between devices on the map.
 * Edges are formed when a device's output port shares the exact same world coordinate 
 * as another device's input port.
 */
export function build_device_graph(map: game_map, definitions: Record<string, device_definition>): device_graph
{
    const graph: device_graph = new Map()

    // Initialize nodes
    for (const dev of map.devices)
    {
        graph.set(dev.unique_id, {
            device_id: dev.unique_id,
            next_nodes: [],
            prev_nodes: []
        })
    }

    // Maps port world coordinates (as string) to an array of device unique_ids
    const input_map = new Map<string, number[]>()
    const output_map = new Map<string, number[]>()

    // Populate the port maps
    for (const dev of map.devices)
    {
        const def = definitions[dev.definition_id]
        if (!def)
        {
            continue
        }

        const inputs = get_world_ports(dev, def, 'input')
        for (const port of inputs)
        {
            const key = vector_to_string(port)
            if (!input_map.has(key))
            {
                input_map.set(key, [])
            }
            input_map.get(key)!.push(dev.unique_id)
        }

        const outputs = get_world_ports(dev, def, 'output')
        for (const port of outputs)
        {
            const key = vector_to_string(port)
            if (!output_map.has(key))
            {
                output_map.set(key, [])
            }
            output_map.get(key)!.push(dev.unique_id)
        }
    }

    // Build edges by matching output port coordinates to input port coordinates
    for (const [pos_key, source_ids] of output_map.entries())
    {
        const target_ids = input_map.get(pos_key)
        if (target_ids)
        {
            for (const src of source_ids)
            {
                for (const tgt of target_ids)
                {
                    // Prevent self-connections if a device overlaps its own ports
                    if (src === tgt)
                    {
                        continue
                    }

                    const src_node = graph.get(src)!
                    const tgt_node = graph.get(tgt)!

                    if (!src_node.next_nodes.includes(tgt))
                    {
                        src_node.next_nodes.push(tgt)
                    }
                    if (!tgt_node.prev_nodes.includes(src))
                    {
                        tgt_node.prev_nodes.push(src)
                    }
                }
            }
        }
    }

    return graph
}
