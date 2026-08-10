import { create_pack_registry, load_pack } from '@/core/pack_manager'
import { create_device, move_device, rotate_device, delete_device } from '@/core/map_manager'
import { trigger_build_graph, trigger_check_overlap } from '@/core/hooks'
import { init_vanilla_pack } from '@/packs/vanilla/index'
import type { game_map, device, pack } from '@/core/types'
import * as fs from 'fs'

const test_devices = JSON.parse(fs.readFileSync('./src/packs/test/data/devices.json', 'utf8'))
// Simulate loader injecting namespace
const test_pack: pack = {
    id: "test",
    items: [],
    recipes: [],
    device_definitions: test_devices.map((d: any) => ({ ...d, id: `test:${d.id}` }))
}

const registry = create_pack_registry()
load_pack(registry, test_pack)
init_vanilla_pack()

const map: game_map = {
    size: {x: 20, y: 20, z: 2},
    next_unique_id: 1,
    devices: []
}

// ==========================================
// 1. 初始化與建立裝置 (使用 create_device)
// ==========================================
// 先全部在原點建立
const dev_assembler: device = { unique_id: 1, definition_id: "test:assembler", position: {x:0, y:0, z:0}, rotation: {x:0, y:0, z:0}, other_info: {} }
const dev_splitter: device = { unique_id: 2, definition_id: "test:splitter", position: {x:0, y:0, z:0}, rotation: {x:0, y:0, z:0}, other_info: {} }
const dev_belt1: device = { unique_id: 3, definition_id: "test:belt", position: {x:0, y:0, z:0}, rotation: {x:0, y:0, z:0}, other_info: {} }
const dev_merger: device = { unique_id: 4, definition_id: "test:merger", position: {x:0, y:0, z:0}, rotation: {x:0, y:0, z:0}, other_info: {} }
const dev_overlap: device = { unique_id: 5, definition_id: "test:belt", position: {x:0, y:0, z:0}, rotation: {x:0, y:0, z:0}, other_info: {} }
const dev_oob: device = { unique_id: 6, definition_id: "test:assembler", position: {x:0, y:0, z:0}, rotation: {x:0, y:0, z:0}, other_info: {} }

create_device(map, dev_assembler)
create_device(map, dev_splitter)
create_device(map, dev_belt1)
create_device(map, dev_merger)
create_device(map, dev_overlap)
create_device(map, dev_oob)

// ==========================================
// 2. 佈置到正確位置 (使用 move_device 與 rotate_device)
// ==========================================
// Assembler 放到 (4, 4)
move_device(map, 1, {x: 4, y: 4, z: 0})

// Splitter 接 Assembler 輸出，放在 (8, 4)，並轉 270 度
move_device(map, 2, {x: 8, y: 4, z: 0})
rotate_device(map, 2, {x: 0, y: 0, z: 3})

// Belt 接 Splitter 輸出，放在 (10, 4)，轉 270 度
move_device(map, 3, {x: 10, y: 4, z: 0})
rotate_device(map, 3, {x: 0, y: 0, z: 3})

// Merger 接 Belt，放在 (12, 4)
move_device(map, 4, {x: 12, y: 4, z: 0})

// Overlap 裝置故意放在 (6, 4) 與 Assembler 重疊
move_device(map, 5, {x: 6, y: 4, z: 0})

// OOB 裝置故意放在 (18, 18) 導致部分超出 20x20 邊界
move_device(map, 6, {x: 18, y: 18, z: 0})

// ==========================================
// 3. 測試初始重疊與有向圖
// ==========================================
console.log("=== 初始狀態：重疊與出界 ===")
let overlap_result = trigger_check_overlap(map, registry)
console.log(JSON.stringify(overlap_result, null, 2))

console.log("\n=== 初始狀態：有向圖 ===")
let graph = trigger_build_graph(map, registry)
console.log(JSON.stringify(graph, null, 2))

// ==========================================
// 4. 清理並修正地圖 (使用 delete_device)
// ==========================================
console.log("\n=== 移除有問題的裝置 (ID: 5, ID: 6) ===")
delete_device(map, 5)
delete_device(map, 6)

console.log("\n=== 修正後：重疊與出界 ===")
overlap_result = trigger_check_overlap(map, registry)
console.log(JSON.stringify(overlap_result, null, 2))

console.log("\n=== 修正後：有向圖 ===")
graph = trigger_build_graph(map, registry)
console.log(JSON.stringify(graph, null, 2))
