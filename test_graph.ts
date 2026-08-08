import { create_pack_registry, load_pack } from './src/core/pack_manager'
import { create_device } from './src/core/map_manager'
import { build_device_graph } from './src/utils/graph'
import type { game_map, pack, device } from './src/core/types'

// Mock Pack
const test_pack: pack = {
    id: "test",
    items: [],
    recipes: [],
    device_definitions: [
        {
            id: "test:assembler",
            positions: [{x:0, y:0, z:0}],
            input_ports: [{x: 0, y: 0, z: 0}], // Reads from its own body
            output_ports: [{x: 1, y: 0, z: 0}], // Outputs to right cell
            recipe_ids: []
        },
        {
            id: "test:belt",
            positions: [{x:0, y:0, z:0}],
            input_ports: [{x: 0, y: 0, z: 0}],
            output_ports: [{x: 1, y: 0, z: 0}],
            recipe_ids: []
        }
    ]
}

const registry = create_pack_registry()
load_pack(registry, test_pack)

const map: game_map = {
    size: {x: 10, y: 10, z: 1},
    next_unique_id: 1,
    devices: []
}

// Dev 1 (Assembler) at (1,0) pointing right (0 rotation)
// Input at (0,0), Output at (2,0)
const dev1: device = {
    unique_id: 1,
    definition_id: "test:assembler",
    position: {x: 1, y: 0, z: 0},
    rotation: {x:0, y:0, z:0},
    other_info: {}
}

// Dev 2 (Belt) at (2,0) pointing right (0 rotation)
// Input at (1,0), Output at (3,0)
const dev2: device = {
    unique_id: 2,
    definition_id: "test:belt",
    position: {x: 2, y: 0, z: 0},
    rotation: {x:0, y:0, z:0},
    other_info: {}
}

// Dev 3 (Belt) at (3,1) (Not connected)
const dev3: device = {
    unique_id: 3,
    definition_id: "test:belt",
    position: {x: 3, y: 1, z: 0},
    rotation: {x:0, y:0, z:0},
    other_info: {}
}

create_device(map, dev1)
create_device(map, dev2)
create_device(map, dev3)

const graph = build_device_graph(map, registry)
console.log(JSON.stringify(graph, null, 2))
