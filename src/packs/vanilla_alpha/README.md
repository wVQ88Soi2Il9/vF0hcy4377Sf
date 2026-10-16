# vanilla_alpha

## 目的

提供最基礎的可逆空間操作的 `op_template`，以及 registry 查詢工具。修改 space 一律以 template 產生 `rev_op` 再交給 `world.submit`。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `manifest { pack_id: 'vanilla_alpha' }`；重新匯出下列模組 |
| `templates.ts` | 4 個 `op_template`（`satisfies core.op_template<pure_world>`，參數有型別）：`create_device_template`、`delete_device_template`、`move_device_template`、`select_recipe_template`；`create` 回傳 `rev_op`。不登記於 manifest：登記給 CLI 的是 `vanilla_beta` 的包裝，兩邊同名登記會讓不帶前綴的指令 ambiguous |
| `query.ts` | `parse_namespaced_id`、`format_namespaced_id`，以及 registry 的 `has_*` / `get_*`（item、recipe、device_class、op_template；`get_*` 找不到時拋出例外） |

變更通知統一由 world 的 `core:committed` 發出（見 [src/README.md](../../README.md)），本 pack 不宣告 hook。CLI 用的 `op_templates`（解析字串參數）由 `vanilla_beta` 包裝。
