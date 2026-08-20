import { create_map, create_device, select_recipe, get_device_class } from '@/API';
import { set_map, set_registry } from '@/runtime';
import { create_pack_registry, load_pack } from '@/core/pack_manager';
import { load_all_packs, call_all_pack_inits, load_all_device_classes } from './packs/loader';

// 1. 建立 registry，載入所有 JSON 資料、動態配方模組與裝置類別
const registry = create_pack_registry();
for (const p of load_all_packs())
{
    load_pack(registry, p);
}
load_all_device_classes(registry);

// 2. 建立測試地圖（next uid 預設從 1 開始，3 維空間: 20×20×5）
const map = create_map([20, 20, 5]);

// 3. 在 loader 呼叫 init_pack() 之前，先把 map 和 registry 注冊到 API
//    這樣 basic_renderer 的 init_pack() 就能用 get_map() / get_registry() 拿到
set_map(map);
set_registry(registry);

// 4. 呼叫所有 pack 的 init_pack()（包含 basic_renderer）
call_all_pack_inits();

// 5. 放些 3D 測試設備（包含 3D 不規則圖形裝置）
const assembler_cls = get_device_class(registry, 'test:assembler')!;
const dev1 = create_device(map, assembler_cls, 'test:assembler', [2, 2, 0]);
select_recipe(map, dev1.uid, 'test:iron_gear');

const irr_cls = get_device_class(registry, 'test:irregular_3d')!;
create_device(map, irr_cls, 'test:irregular_3d', [4, 4, 0]);

const belt_cls = get_device_class(registry, 'test:belt')!;
create_device(map, belt_cls, 'test:belt', [6, 2, 0]);

const splitter_cls = get_device_class(registry, 'test:splitter')!;
create_device(map, splitter_cls, 'test:splitter', [8, 2, 0]);