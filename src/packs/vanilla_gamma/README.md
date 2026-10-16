# vanilla_gamma

## 目的

world 的計算：依 `vanilla_beta` 建出的圖，呼叫每個 device 的 recipe。依賴方向為 `vanilla_gamma → vanilla_beta → vanilla_alpha → core`。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `manifest { pack_id: 'vanilla_gamma' }`；重新匯出下列模組 |
| `evaluate.ts` | `evaluate_world(world)`：以 `vanilla_beta.build_graph` 建圖、只計算 `graph_devices` 中的 device，拓撲排序後依序呼叫 recipe，context 為 `recipe_context { space, uid, inputs }`（inputs 依 input 埠順序），回傳 `Map<uid, item_stack[]>`，不存入 world；未接上的 input 與未選 recipe 的 output 為 `null_stack()`；有環、輸出數量與 output 埠數不符時報錯 |

## Todo

以下是現況觀察與未決事項，未修改。

- 環是合法的，但計算方式未定：`evaluate_world` 遇環報錯（docket 20261016072425）。
- bidirectional 埠不列入 inputs / outputs 順序；方向由 recipe 決定，尚未定案。
