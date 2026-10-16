# ez_recipe

## 目的

以 `extends core.recipe` 的型別快速表達常見的 recipe，不必手寫函式。依賴方向為 `ez_recipe → vanilla_alpha → core`。只提供定義，不加入 `src/main.ts` 的 `ENABLED_PACKS`。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `manifest { pack_id: 'ez_recipe' }`；重新匯出下列模組 |
| `combination.ts` | `combination`：葉為 `core.item_stack`（係數），節點為 `ordered(...)`、`unordered(...)`，可任意巢狀、可為空；不正規化，`unordered(b, b)` 與 `b×2` 不同；`check_combination` 檢查葉的係數為正有限數；`scale_combination(comb, t)` 每個葉乘以 t，結構不變 |
| `parse.ts` | `parse_combination(text)`：`[ ]` 為 `ordered`、`{ }` 為 `unordered`，可任意巢狀、可為空；葉寫 `[係數*]pack:id`，係數省略為 1，namespace 必填；語法錯誤或係數不合法時報錯。如 `'[{p:a, 2*p:b}, p:c]'`；`pack:id` 以 `vanilla_alpha.parse_namespaced_id` 解析 |
| `ratio.ts` | `ratio_recipe`：固定比例（1 維線性映射），`inputs`、`outputs` 為 1 單位係數的 `combination`；`ratio(identifier, inputs, outputs)` 建立並檢查係數；`scale_ratio(recipe, t)` 回傳 t 倍的兩側（t ≥ 0），如 `a + 2b = c` 乘 3 得 `3a + 6b = 3c`；`solve_ratio(recipe, side, item_id, quantity)` 由指定側某 item 的目標量反推 t 與兩側，係數取該側同 item 葉的總和，如要 3c 得 t = 3、需 3a + 6b；item 不在該側時報錯；`evaluate` 呼叫即報錯 |

## Todo

以下是未決事項。

- `evaluate` 未實作：等計算模型定案。
- `ordered` 的順序對應什麼（埠、時間等）未定。
- 其他種類未做：polynomial、const、identity、exp。
