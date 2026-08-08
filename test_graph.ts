import { create_pack_registry, load_pack } from './src/core/pack_manager'
import { create_device } from './src/core/map_manager'
import { build_device_graph } from './src/utils/graph'
import { check_map_overlap } from './src/utils/overlap'
import type { game_map, pack, device } from './src/core/types'

const test_pack: pack = {
    id: "test",
    items: [],
    recipes: [],
    device_definitions: [
        {
            id: "test:assembler",
            // 2x2 機器
            shape: [
                {x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0},
                {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0}
            ],
            // 假設左側輸入
            input_ports: [{x: -1, y: 0, z: 0}],
            // 假設右側輸出
            output_ports: [{x: 2, y: 0, z: 0}, {x: 2, y: 1, z: 0}],
            recipe_ids: []
        },
        {
            id: "test:belt",
            // 1x1 傳送帶
            shape: [{x: 0, y: 0, z: 0}],
            input_ports: [{x: 0, y: -1, z: 0}], // 上方輸入
            output_ports: [{x: 0, y: 1, z: 0}], // 下方輸出
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

// ==========================================
// 創建裝置
// ==========================================

// 1. Assembler 在 (2, 2)
// 佔據: (2,2), (3,2), (2,3), (3,3)
// 輸入埠: (1,2)
// 輸出埠: (4,2), (4,3)
const dev_assembler: device = {
    unique_id: 1,
    definition_id: "test:assembler",
    position: {x: 2, y: 2, z: 0},
    rotation: {x: 0, y: 0, z: 0},
    other_info: {}
}

// 2. Belt 1 在 (4, 3) 
// 佔據: (4,3)
// 輸入埠: (4,2) (剛好接上 dev_assembler 的第一個輸出埠 4,2)
// 輸出埠: (4,4)
const dev_belt1: device = {
    unique_id: 2,
    definition_id: "test:belt",
    position: {x: 4, y: 3, z: 0},
    rotation: {x: 0, y: 0, z: 0},
    other_info: {}
}

// 3. Belt 2 在 (3, 2) - 刻意讓他跟 Assembler 重疊
// 佔據: (3,2) (與 Assembler 的 (3,2) 重疊)
const dev_belt2: device = {
    unique_id: 3,
    definition_id: "test:belt",
    position: {x: 3, y: 2, z: 0},
    rotation: {x: 0, y: 0, z: 0},
    other_info: {}
}

// 4. Assembler 在 (9, 9) - 刻意出界
// 佔據: (9,9), (10,9), (9,10), (10,10) (超出 10x10 地圖邊界)
const dev_out_of_bounds: device = {
    unique_id: 4,
    definition_id: "test:assembler",
    position: {x: 9, y: 9, z: 0},
    rotation: {x: 0, y: 0, z: 0},
    other_info: {}
}

create_device(map, dev_assembler)
create_device(map, dev_belt1)
create_device(map, dev_belt2)
create_device(map, dev_out_of_bounds)

// ==========================================
// 測試功能
// ==========================================
console.log("=== 測試重疊與出界 (src/utils/overlap.ts) ===")
const overlap_result = check_map_overlap(map, registry)
console.log(JSON.stringify(overlap_result, null, 2))

console.log("\n=== 測試裝置有向圖 (src/utils/graph.ts) ===")
const graph = build_device_graph(map, registry)
console.log(JSON.stringify(graph, null, 2))
