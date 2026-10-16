# vanilla_beta

## 目的

放在 `vanilla_alpha` 之外的輔助工具：軸名稱、歷史節點中繼資料與分支工具、2× 網格校驗與重疊檢查、參數解析，以及把 `vanilla_alpha` 的 4 個 template 包成接受 CLI 參數的 `op_templates`。`vanilla_alpha` 更接近 core，不為此修改；依賴方向為 `vanilla_beta → vanilla_alpha → core`。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | manifest 在 `provides.op_templates` 以 `create_device`、`delete_device`、`move_device`、`select_recipe` 註冊 4 個 `*_template_api`；重新匯出下列模組 |
| `axes.ts` | `parse_axis_name`（`"d1"` → `0`，格式不符回傳 `null`）、`format_axis_name`（反向，非法索引拋出例外） |
| `history.ts` | 節點中繼資料 `pinned`、`merged_from`（存於 `other_info.vanilla_beta`）的讀寫；`get_pinned_nodes`、`clear_all_pinned_nodes`；`delete_branch`（刪除子樹，位於目前活躍路徑上者拒絕）；`extract_branch_path` |
| `parse.ts` | `parse_int`、`parse_vector`：驗證整數與座標參數，格式錯誤時報錯 |
| `templates_api.ts` | 4 個 `op_template`（`create_device_template_api` 等；解析參數後呼叫 `vanilla_alpha` 對應 template 的 `create`），以及 `parse_qualified_id`（必須為 `pack:id`）、`parse_uid`（必須為字串）、`parse_anchor`（個數等於 `space.dimension`，且全為偶數）。uid 由 `core.generate_uid` 產生；參數錯誤在 `create` 時報錯，不進入歷史 |
| `spatial.ts` | 向量算術、`is_valid_device_position`（全偶數）、`is_valid_port_position`（恰 1 軸為偶數）、`get_port_axis`、`spatial_map<T>`、`is_out_of_bounds`、`check_map_overlap` |

## Todo

以下是現況觀察與未決事項，未修改。

- `delete_branch` 直接呼叫 `core.delete_node`，不經過 world，不會發出 `core:committed`。與通知的關係未決。
- `check_map_overlap` 的第二個參數 `_registry` 沒有使用。
- 4 個模板不寫 `other_info.cli`：描述由 cli 的上游常數表提供（避免 vanilla_beta 引用 cli）。
