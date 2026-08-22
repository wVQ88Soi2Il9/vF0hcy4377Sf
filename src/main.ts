import { create_map, create_history_tree } from '@/API';
import { set_map, set_registry, set_history_tree } from '@/runtime';
import { create_pack_registry, load_pack } from '@/core/pack_manager';
import { load_all_packs, call_all_pack_inits, load_all_device_classes } from './packs/loader';

// 1. 建立 registry，載入所有 JSON 資料、動態配方模組與裝置類別
const registry = create_pack_registry();
for (const p of load_all_packs())
{
    load_pack(registry, p);
}
load_all_device_classes(registry);

// 2. 建立地圖（3 維空間: 20×20×8，全偶數網格錨點）與歷史樹
const map = create_map([64, 64, 4]);
const history_tree = create_history_tree();

// 3. 在 loader 呼叫 init_pack() 之前，註冊 map, registry 和 history_tree
set_map(map);
set_registry(registry);
set_history_tree(history_tree);

// 4. 呼叫所有 pack 的 init_pack()
call_all_pack_inits();


