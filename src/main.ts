import { create_map, create_history_tree, jump_to_history, create_pack_registry } from '@/core';
import { set_map, set_registry, set_history_tree } from '@/runtime';
import { load_all_packs, call_all_pack_inits } from './packs/loader';
import { execute_command } from './packs/shirones_ui/cli_executor';

// 1. 建立 registry，載入所有 Pack 模組
const registry = create_pack_registry();
load_all_packs(registry);

// 2. 建立地圖（3 維空間: 64×64×4，全偶數網格錨點）與歷史樹
const map = create_map([64, 64, 4]);
const history_tree = create_history_tree();

// 3. 在 loader 呼叫 init_pack() 之前，註冊 map, registry 和 history_tree
set_map(map);
set_registry(registry);
set_history_tree(history_tree);

// 4. 呼叫所有 pack 的 init_pack()
call_all_pack_inits();

// 5. 模擬真實開發操作：建立豐富多分支歷程（約 50 步歷史操作）
// --- 主線幹道：工廠流水線第 1 期 (#1 ~ #12) ---
execute_command('create --"test:assembler" --"4, 4, 0"');      // #1
execute_command('create --"test:belt" --"10, 4, 0"');           // #2
execute_command('create --"test:merger" --"16, 4, 0"');         // #3
execute_command('move --"2" --"10, 8, 0"');                     // #4
execute_command('create --"test:belt" --"4, 12, 0"');          // #5
execute_command('create --"test:assembler" --"4, 18, 0"');     // #6
execute_command('create --"test:belt" --"10, 18, 0"');         // #7
execute_command('create --"test:splitter" --"16, 18, 0"');     // #8
execute_command('move --"6" --"4, 20, 0"');                     // #9
execute_command('create --"test:belt" --"22, 18, 0"');         // #10
execute_command('create --"test:merger" --"28, 18, 0"');        // #11
execute_command('create --"test:belt" --"28, 12, 0"');         // #12

// --- 分支 A：從 #2 探索原料輸入線 (#13 ~ #19) ---
jump_to_history(2);
execute_command('create --"test:splitter" --"10, 16, 0"');     // #13
execute_command('move --"1" --"4, 8, 0"');                      // #14
execute_command('create --"test:belt" --"16, 16, 0"');         // #15
execute_command('create --"test:assembler" --"22, 16, 0"');    // #16
execute_command('move --"16" --"24, 16, 0"');                   // #17
execute_command('create --"test:belt" --"30, 16, 0"');         // #18
execute_command('create --"test:merger" --"36, 16, 0"');        // #19

// --- 分支 B：從 #4 探索南側高密度產線 (#20 ~ #27) ---
jump_to_history(4);
execute_command('create --"test:assembler" --"16, 12, 0"');    // #20
execute_command('create --"test:belt" --"22, 12, 0"');         // #21
execute_command('create --"test:splitter" --"28, 12, 0"');     // #22
execute_command('move --"20" --"16, 14, 0"');                   // #23
execute_command('create --"test:belt" --"28, 6, 0"');          // #24
execute_command('create --"test:assembler" --"34, 6, 0"');     // #25
execute_command('create --"test:belt" --"40, 6, 0"');          // #26
execute_command('move --"26" --"40, 8, 0"');                    // #27

// --- 分支 C：從 #8 延伸出次級加工區 (#28 ~ #36) ---
jump_to_history(8);
execute_command('create --"test:belt" --"16, 24, 0"');         // #28
execute_command('create --"test:assembler" --"16, 30, 0"');    // #29
execute_command('move --"29" --"18, 30, 0"');                   // #30
execute_command('create --"test:splitter" --"24, 30, 0"');     // #31
execute_command('create --"test:belt" --"24, 36, 0"');         // #32
execute_command('create --"test:belt" --"30, 30, 0"');         // #33
execute_command('create --"test:merger" --"36, 30, 0"');        // #34
execute_command('move --"32" --"24, 38, 0"');                   // #35
execute_command('create --"test:assembler" --"30, 38, 0"');    // #36

// --- 分支 D：從 #15 測試分流迴路 (#37 ~ #43) ---
jump_to_history(15);
execute_command('create --"test:merger" --"16, 22, 0"');        // #37
execute_command('create --"test:belt" --"10, 22, 0"');         // #38
execute_command('move --"38" --"8, 22, 0"');                    // #39
execute_command('create --"test:assembler" --"8, 28, 0"');     // #40
execute_command('create --"test:belt" --"8, 34, 0"');          // #41
execute_command('move --"40" --"8, 30, 0"');                    // #42
execute_command('create --"test:splitter" --"14, 34, 0"');     // #43

// --- 回到主線 #12 繼續推展主幹工程 (#44 ~ #52) ---
jump_to_history(12);
execute_command('create --"test:assembler" --"34, 12, 0"');    // #44
execute_command('create --"test:belt" --"40, 12, 0"');         // #45
execute_command('create --"test:splitter" --"46, 12, 0"');     // #46
execute_command('move --"44" --"34, 14, 0"');                   // #47
execute_command('create --"test:belt" --"46, 18, 0"');         // #48
execute_command('create --"test:belt" --"46, 6, 0"');          // #49
execute_command('create --"test:merger" --"52, 12, 0"');        // #50
execute_command('move --"50" --"52, 14, 0"');                   // #51
execute_command('create --"test:assembler" --"58, 14, 0"');    // #52

// --- 最終切換至最新主幹末端 #52 ---
jump_to_history(52);
