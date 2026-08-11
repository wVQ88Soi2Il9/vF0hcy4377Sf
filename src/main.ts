// main.ts
import { init } from './packs/basic_renderer'
import { create_pack_registry, load_pack } from './core/pack_manager'
import { load_all_packs } from './packs/loader'
import { game_map } from './core'

// 1. 建立 canvas
const canvas = document.createElement('canvas')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.getElementById('app')?.appendChild(canvas)

// 2. 載入 registry
const registry = create_pack_registry()
for (const p of load_all_packs())
{
    load_pack(registry, p)
}

// 3. 建立一個測試地圖
const map: game_map = 
{
    size: { x: 20, y: 20, z: 1 },
    next_unique_id: 1,
    devices: []   // 先空的，之後放設備進去
}

// 4. 啟動 renderer
init(canvas, map, registry)