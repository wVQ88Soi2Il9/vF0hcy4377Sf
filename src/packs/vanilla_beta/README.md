# vanilla_beta

## 目的

放在 `vanilla_alpha` 之外的輔助工具：軸名稱、歷史節點中繼資料與分支工具、2× 網格校驗與重疊檢查。目前只提供函式，不註冊 operation、command 或 hook。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `global_init` 只註冊 `{ pack_id: 'vanilla_beta' }`；`world_init` 為空；重新匯出下列三個模組 |
| `axes.ts` | `parse_axis_name`（`"d1"` → `0`，格式不符回傳 `null`）、`format_axis_name`（反向，非法索引拋出例外） |
| `history.ts` | 節點中繼資料 `pinned`、`merged_from` 的讀寫；`get_pinned_nodes`、`clear_all_pinned_nodes`；`delete_branch`（刪除子樹，位於目前活躍路徑上者拒絕）；`extract_branch_path` |
| `spatial.ts` | 向量算術、`is_valid_device_position`（全偶數）、`is_valid_port_position`（恰 1 軸為偶數）、`get_port_axis`、`spatial_map<T>`、`is_out_of_bounds`、`check_map_overlap` |

## Todo

以下是現況觀察與未決事項，未修改。

- 歷史節點中繼資料存放在 `other_info['vanilla']`，不是 pack 名稱 `vanilla_beta`；`vanilla_alpha` 的 operation 則使用 `other_info.vanilla_alpha`。是否統一鍵名未決。
- `delete_branch` 直接呼叫 `core.delete_node`，不經過 `std_world`，也不會觸發 `history_delete` hook。與 hook 的關係未決。
- `check_map_overlap` 的第二個參數 `_registry` 沒有使用。
- 這個 pack 的函式在 `src/` 內沒有其他呼叫處，`src/main.ts` 的 `ENABLED_PACKS` 也沒有啟用它。
- `world_init` 為空函式，且沒有放進 registry 條目（見 `vanilla_alpha` 的 Todo）。
