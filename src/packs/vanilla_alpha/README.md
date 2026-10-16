# vanilla_alpha

## 目的

提供最基礎的可逆空間操作工廠、`std_world`，以及 registry 查詢工具。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `manifest { pack_id: 'vanilla_alpha' }`；重新匯出下列模組 |
| `operations.ts` | 4 個 `rev_op` 工廠：`create_device_operation`、`delete_device_operation`、`move_device_operation`、`select_recipe_operation` |
| `world.ts` | `std_world extends pure_world`：`create_device`、`delete_device`、`move_device`、`select_recipe`，各自建立對應的 operation 並 `submit` |
| `query.ts` | `parse_namespaced_id`、`format_namespaced_id`，以及 registry 的 `has_*` / `get_*`（item、recipe、device_class、operation；`get_*` 找不到時拋出例外） |

變更通知統一由 world 的 `core:committed` 發出（見 [src/README.md](../../README.md)），本 pack 不宣告 hook。CLI 用的 `op_templates` 由 `vanilla_beta` 包裝。

## Todo

- **std_world 與 operation 的職責劃分未決**：現在 `std_world` 的方法在內部建立 operation 並執行。是否改為 std_world 只提供不可逆 primitive、由 `operations.ts` 組合成可逆 operation，尚未決定。
