# vanilla_alpha

## 目的

提供最基礎的可逆空間操作、標準世界 `std_world`、registry 查詢工具，以及裝置與歷史相關 hook 的宣告。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `global_init` 註冊 `pack_id` 與 10 個 hook 宣告；`world_init` 注入 relay |
| `operations.ts` | 4 個 `rev_op` 工廠：`create_device_operation`、`delete_device_operation`、`move_device_operation`、`select_recipe_operation` |
| `world.ts` | `std_world extends pure_world`：`create_device`、`delete_device`、`move_device`、`select_recipe`、`execute`、`undo`、`redo`、`jump_to`、`jump_to_prev_fork`、`jump_to_root`、`jump_to_leaf`、`delete_history_node` |
| `query.ts` | `parse_namespaced_id`、`format_namespaced_id`，以及 registry 的 `has_*` / `get_*`（item、recipe、device_class、operation；`get_*` 找不到時拋出例外） |

### Hook

| hook | 觸發點 | 參數 | 轉發到 |
|---|---|---|---|
| `create_device` | `std_world.create_device` | `world, device` | `device_change` |
| `delete_device` | `std_world.delete_device` | `world, device` | `device_change` |
| `move_device` | `std_world.move_device` | `world, device, old_position, new_position` | `device_change` |
| `select_recipe` | `std_world.select_recipe` | `world, device, old_recipe_id, new_recipe_id` | `device_change` |
| `history_record` | `std_world.execute` | `world, node` | `history_change` |
| `history_undo` | `std_world.undo` | `world, history` | `history_change` |
| `history_redo` | `std_world.redo` | `world, history` | `history_change` |
| `history_delete` | `std_world.delete_history_node` | `world, target_uid` | `history_change` |

`device_change` 與 `history_change` 只由 relay 觸發，relay 在 `world_init` 中以 `inject_hook` 注入。

## Todo

以下是現況觀察與未決事項，未修改。

- **bug：`world_init` 不會被呼叫。** `pure_world` 以 `pack.world_init?.(this)` 呼叫 registry 條目上的函式（`src/world.ts:21`），但 `global_init` 只放了 `pack_id` 與 `hooks`，沒有放 `world_init`。因此 relay 沒有被注入，`device_change` 與 `history_change` 目前不會被觸發。其他 pack 的 `world_init` 也沒有放進 registry 條目，但它們目前是空函式。
- **undo / redo 的通知粒度未決**：`undo` / `redo` 只觸發 `history_undo` / `history_redo`，operation 的 `inverse` 不觸發 `create_device` 等 hook。是否採用逐 operation 的反向 hook 尚未決定。
- **`jump_to`、`jump_to_prev_fork`、`jump_to_root`、`jump_to_leaf` 不觸發任何 hook**，也沒有宣告對應的 hook。
- **std_world 與 operation 的職責劃分未決**：現在 `std_world` 的 `create_device` 等方法在內部建立 operation 並執行。是否改為 std_world 只提供不可逆 primitive、由 `operations.ts` 組合成可逆 operation，尚未決定。
- **registry 條目沒有 `op_templates`**：這 4 個操作只存在於 `std_world` 內部，`has_operation` / `get_operation` 查不到。registry 已改存 `core.op_template`（`create(world, ...args) → rev_op`），`get_operation` 回傳模板；但這 4 個工廠的參數是型別化的（`device_class`、`uid` 等），要包成接受 CLI 參數的模板，uid 可直接由 `core.generate_uid` 產生（`std_world.allocate_uid` 預設也是它）；尚需決定 CLI 參數如何對應到裝置類別。
- `src/main.ts` 的 `ENABLED_PACKS` 目前只有 `vanilla_alpha`。
