import { create_device } from '@/API'
import { set_map, set_registry } from '@/runtime'
import { create_pack_registry, load_pack } from '@/core/pack_manager'
import { load_all_packs, call_all_pack_inits } from './packs/loader'

// 1. 建立 registry，載入所有 JSON 資料
const registry = create_pack_registry()
for (const p of load_all_packs())
{
    load_pack(registry, p)
}

// 2. 建立測試地圖
const map =
{
    size: [20, 20, 1],
    next_unique_id: 1,
    devices: []
}

// 3. 在 loader 呼叫 init_pack() 之前，先把 map 和 registry 注冊到 API
//    這樣 basic_renderer 的 init_pack() 就能用 get_map() / get_registry() 拿到
set_map(map)
set_registry(registry)

// 4. 呼叫所有 pack 的 init_pack()（包含 basic_renderer）
call_all_pack_inits()

// 5. 放些測試設備
create_device(map,
{
    unique_id:     map.next_unique_id++,
    definition_id: 'test:assembler',
    position:      [2, 2, 0],
    rotation:      [],
    other_info:    {}
})

create_device(map,
{
    unique_id:     map.next_unique_id++,
    definition_id: 'test:belt',
    position:      [6, 2, 0],
    rotation:      [],
    other_info:    {}
})

create_device(map,
{
    unique_id:     map.next_unique_id++,
    definition_id: 'test:splitter',
    position:      [8, 2, 0],
    rotation:      [],
    other_info:    {}
})