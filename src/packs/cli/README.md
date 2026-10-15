# cli

## 目的

用一行文字呼叫各 pack 提供的指令（`commands`）與操作模板（`op_templates`）。CLI 本身只內建 `help`，不含業務指令。

## Code

| 檔案 | 內容 |
|---|---|
| `tokenize.ts` | `tokenize`：以空白分隔，`'` / `"` 內的空白不分隔；引號未閉合或出現在詞中時報錯 |
| `coerce.ts` | `coerce`：`true` / `false` / `null` / 數字自動轉型，其他保留為文字；引號內一律為文字 |
| `lookup.ts` | `list_commands`、`find_command`（同時查 `commands` 與 `op_templates`；`pack:指令` 或只寫指令名稱；找不到或同名屬於多個 pack 時報錯並列出候選）、`get_description` |
| `run.ts` | `run(target_world, line)`：cmd 呼叫 `execute(target_world, ...args)` 並回傳結果；op_template 呼叫 `create(target_world, ...args)` 產生 `rev_op`，經 `submit` 寫入歷史並回傳該 `rev_op` |
| `parse.ts` | `parse_int`、`parse_vector`：供指令實作驗證整數與座標參數，格式錯誤時報錯 |
| `help.ts` | `help [指令]`：列出所有指令，或查詢單一指令 |

## 指令約定

- `core.cmd.execute(world, ...args)`：第一個參數為目標 world。
- `core.op_template.create(world, ...args)`：模板，每次產生新的 `rev_op`；參數封在 `rev_op` 內，undo / redo 不再需要參數。
- 同一個 pack 的 `commands` 與 `op_templates` 不可同名，`compose` 時報錯。
- 描述放在 `other_info.cli.description`（文字）；`other_info` 依命名空間分層，cli 只讀自己的 `cli` 鍵。缺少時 `help` 報錯。
- 2× 網格的偶數規則不在 `parse.ts` 內，交給 `vanilla_beta` 的位置驗證。

## Todo

- **Console 使用未決**：原功能「在 DevTools Console 直接輸入指令，結果與錯誤印在 Console」尚未實作；如何暴露到 Console、綁定哪個 world 未決（docket plan 20261015175159）。
