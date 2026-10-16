# ez_recipe

## 目的

以 `extends core.recipe` 的型別快速表達常見的 recipe，不必手寫函式。依賴方向為 `ez_recipe → core`。只提供定義，不加入 `src/main.ts` 的 `ENABLED_PACKS`。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `manifest { pack_id: 'ez_recipe' }`；重新匯出下列模組 |
| `ratio.ts` | `ratio_recipe`：固定比例（1 維線性映射），`inputs`、`outputs` 為 1 單位的係數（`core.item_stack[]`，以 item id 為基底的向量，順序無關）；`ratio(identifier, inputs, outputs)` 建立，係數須為正有限數、同一側 item 不重複；`scale_ratio(recipe, t)` 回傳 t 倍的兩側，如 `a + 2b = c` 乘 3 得 `3a + 6b = 3c`；`evaluate` 呼叫即報錯 |

## Todo

以下是未決事項。

- `evaluate` 未實作：等計算模型定案。
- 其他種類未做：polynomial、const、identity、exp。
