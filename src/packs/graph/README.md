# graph

## 目的

從 space 建圖，以及圖的檢查與排序；只讀取 space，不修改。依賴方向為 `graph → vanilla_beta → vanilla_alpha → core`。只提供定義，不加入 `src/main.ts` 的 `ENABLED_PACKS`。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `manifest { pack_id: 'graph' }`；重新匯出下列模組 |
| `graph.ts` | `build_graph(space)`：從 space 現建圖，one position one port：同一全域座標恰有 1 個 output 與 1 個 input 時連邊，其他組合（同向、3 個以上、含 bidirectional）的座標不計入圖；`graph_devices(space)`：重疊或出界的 device（`check_map_overlap`）不計入圖 |
| `dag.ts` | `is_dag(space)`；`topological_order(space)`：計入圖的 device 依 Kahn 演算法排序，有環時報錯 |

## Todo

以下是未決事項。

- 圖出現環時的處理未定：目前只提供判定，不攔截造成環的操作。
- bidirectional 埠不列入圖；方向由 recipe 決定，尚未定案。
