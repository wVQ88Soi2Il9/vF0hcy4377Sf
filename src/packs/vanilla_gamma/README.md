# vanilla_gamma

## 目的

world 的計算：依 `vanilla_beta` 建出的圖求穩態流量（反壓），以及運轉規則與 `select_rule`。依賴方向為 `vanilla_gamma → vanilla_beta → vanilla_alpha → core`。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | manifest 在 `provides.op_templates` 以 `select_rule` 註冊 `select_rule_template_api`；重新匯出下列模組 |
| `ports.ts` | `ports_of(device, direction)`：bidirectional 埠不列入 |
| `rule.ts` | `operating_rule`（`proportional` \| `priority(order)`，order 為 input 埠索引排列）；recipe 宣告 `other_info.vanilla_gamma.flow.rule`（預設規則）；device 覆寫值 `other_info.vanilla_gamma.rule`（`get_device_rule` / `set_device_rule`）；`select_rule_template`（有型別，create 時以 device 的 input 埠數檢查 order，可 undo）；`select_rule_template_api`（`select_rule <uid> [proportional \| priority <i...>]`，省略規則時清除覆寫值）。換 recipe 不清除覆寫值：埠由 device 決定 |
| `evaluate.ts` | `evaluate_world(world)`：穩態流量，quantity 為每單位時間流量。以 `vanilla_beta.build_graph` 建圖、只計算 `graph_devices`，依拓撲順序算每個 device 的運轉點；output 上限為下游上一輪的消耗（沒接上為 ∞），反覆至前後兩輪相差 ≤ 1e-9，超過 device 數 × 2 輪 throw；求解不放寬（二分到浮點數無法再切分、`fits` 不允許超過上限），誤差只剩浮點捨入，須遠小於收斂容差。運轉點：f 對每個 input 單調遞增、不必是 injective；先依規則（device 覆寫值優先，否則 recipe 預設；input ≥ 2 而無規則時 throw）求最大可行輸出，再把消耗縮到仍維持該輸出的最小值（priority 從最低優先的埠起縮減），多餘供應反壓回上游。source 輸出 t·f()（t ∈ [0, 1] 取最大）；沒有 output 的 sink 全收；未選 recipe 消耗 0、輸出 `null_stack()`。context 為 `recipe_context { space, uid, inputs }`，回傳 `Map<uid, item_stack[]>`，不存入 world；有環、輸出數量與 output 埠數不符時報錯 |

## Todo

以下是現況觀察與未決事項，未修改。

- 環是合法的，但計算方式未定：`evaluate_world` 遇環報錯（docket 20261016072425）。
- bidirectional 埠不列入 inputs / outputs 順序；方向由 recipe 決定，尚未定案。
