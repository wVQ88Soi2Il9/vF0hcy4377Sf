# vanilla_beta

## 目的

放在 `vanilla_alpha` 之外的輔助工具：軸名稱、歷史節點中繼資料與分支工具、2× 網格校驗與重疊檢查、參數解析，以及把 `vanilla_alpha` 的 4 個操作包成 `op_templates`。`vanilla_alpha` 更接近 core，不為此修改；依賴方向為 `vanilla_beta → vanilla_alpha → core`。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | manifest 在 `provides.op_templates` 註冊 `create_device`、`delete_device`、`move_device`、`select_recipe`；重新匯出下列模組 |
| `axes.ts` | `parse_axis_name`（`"d1"` → `0`，格式不符回傳 `null`）、`format_axis_name`（反向，非法索引拋出例外） |
| `history.ts` | 節點中繼資料 `pinned`、`merged_from`（存於 `other_info.vanilla_beta`）的讀寫；`get_pinned_nodes`、`clear_all_pinned_nodes`；`delete_branch`（刪除子樹，位於目前活躍路徑上者拒絕）；`extract_branch_path` |
| `parse.ts` | `parse_int`、`parse_vector`：驗證整數與座標參數，格式錯誤時報錯 |
| `templates.ts` | 4 個 `op_template`，以及 `parse_qualified_id`（必須為 `pack:id`）、`parse_uid`（必須為字串）、`parse_anchor`（個數等於 `space.dimension`，且全為偶數）。uid 由 `core.generate_uid` 產生；參數錯誤在 `create` 時報錯，不進入歷史 |
| `evaluate.ts` | `build_graph(space)`：從 space 現建圖，one position one port：同一全域座標恰有 1 個 output 與 1 個 input 時連邊，其他組合（同向、3 個以上、含 bidirectional）的座標不計入圖；`evaluate_world(world)`：拓撲排序後依序呼叫 recipe，context 為 `recipe_context { space, uid, inputs }`（inputs 依 input 埠順序），回傳 `Map<uid, item_stack[]>`，不存入 world；未接上的 input 與未選 recipe 的 output 為 `null_stack()`；有環、輸出數量與 output 埠數不符時報錯 |
| `spatial.ts` | 向量算術、`is_valid_device_position`（全偶數）、`is_valid_port_position`（恰 1 軸為偶數）、`get_port_axis`、`spatial_map<T>`、`is_out_of_bounds`、`check_map_overlap` |

## Todo

以下是現況觀察與未決事項，未修改。

- `delete_branch` 直接呼叫 `core.delete_node`，不經過 `std_world`，也不會觸發 `history_delete` hook。與 hook 的關係未決。
- `check_map_overlap` 的第二個參數 `_registry` 沒有使用。
- 4 個模板不寫 `other_info.cli`：描述由 cli 的上游常數表提供（避免 vanilla_beta 引用 cli）。
- 環是合法的，但計算方式未定：`evaluate_world` 遇環報錯（docket 20261016072425）。
- bidirectional 埠不列入圖與 inputs / outputs 順序；方向由 recipe 決定，尚未定案。
- `world_init` 為空函式，且沒有放進 registry 條目（見 `vanilla_alpha` 的 Todo）。
