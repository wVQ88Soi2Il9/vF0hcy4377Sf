# ez_recipe

## 目的

以 `extends core.recipe` 的型別快速表達常見的 recipe，不必手寫函式。依賴方向為 `ez_recipe → graph → vanilla_beta → vanilla_alpha → core`。只提供定義，不加入 `src/main.ts` 的 `ENABLED_PACKS`。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `manifest { pack_id: 'ez_recipe' }`；重新匯出下列模組 |
| `combination.ts` | `combination`：葉為 `core.item_stack`（係數），節點為 `ordered(...)`、`unordered(...)`，可任意巢狀、可為空；不正規化，`unordered(b, b)` 與 `b×2` 不同；`check_combination` 檢查葉的係數為正有限數；`scale_combination(comb, t)` 每個葉乘以 t，結構不變 |
| `parse.ts` | `parse_combination(text)`：`[ ]` 為 `ordered`、`{ }` 為 `unordered`，可任意巢狀、可為空；葉寫 `[係數*]pack:id`，係數省略為 1，namespace 必填；語法錯誤或係數不合法時報錯。如 `'[{p:a, 2*p:b}, p:c]'`；`pack:id` 以 `vanilla_alpha.parse_namespaced_id` 解析 |
| `ratio.ts` | `ratio_recipe`：固定比例（1 維線性映射），`inputs`、`outputs` 為 1 單位係數的 `combination`；`upper_bound` 為 t 的上限（可為 `Infinity`）；`ratio(identifier, inputs, outputs, upper_bound)` 建立並檢查係數與上限，以 `other_info.ez_recipe.kind = 'ratio'` 標記，`is_ratio_recipe` 判斷；`scale_ratio(recipe, t)` 回傳 t 倍的兩側（t ≥ 0），如 `a + 2b = c` 乘 3 得 `3a + 6b = 3c`；`solve_ratio(recipe, side, item_id, quantity)` 由指定側某 item 的目標量反推 t 與兩側，係數取該側同 item 葉的總和，如要 3c 得 t = 3、需 3a + 6b；item 不在該側時報錯；`evaluate` 呼叫即報錯 |
| `evaluate.ts` | `evaluate_ratio_graph(space, registry)`：限定 ratio 的穩態，每條邊供需相等、沒有多餘產出；每個弱連通部分推出相對倍率 r，`t = s·r`，`s = min(upper_bound / r)`，可為 `Infinity`；比例對不上（不分方向的迴路）時該部分 `t = 0`（取最小再往下游縮減的極限），比較容差為相對 1e-9；埠依 `get_port()` 同方向的順序對應展開後的葉，`unordered` 依邊另一端的 item 配對；回傳各 device 的 `{ t, inputs, outputs }` 與沒接上游的 input（依 device、item 加總）；未選 recipe、不是 ratio、葉數與埠數不符、邊兩端 item 不同、配對不唯一、有向環時報錯 |

## Todo

以下是未決事項。

- `ratio_recipe.evaluate`（單一 recipe 的 context 版）仍未實作；整張圖的計算在 `evaluate_ratio_graph`。
- 非 ratio 的 recipe 不在計算範圍。
- 其他種類未做：polynomial、const、identity、exp。
- `evaluate_ratio_graph` 的相對倍率 r 是連乘的，很長的放大鏈會溢位成 `Infinity`，使 t 變成 `NaN`；實測約 1100 段 ×2 就會發生（docket 20261016204424）。
- `evaluate_ratio_graph` 展開 `unordered` 時，相同子項不重複排列，但不同子項仍是 n! 種，所以單一群組有很多不同子項時很慢：9 個約 1.5 s（docket 20261016204424）。
