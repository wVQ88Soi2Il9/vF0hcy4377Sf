# cli

## 目的

用一行文字呼叫各 pack 提供的指令（`commands`）與操作模板（`op_templates`）。CLI 本身只內建 `help`，不含業務指令。

## Code

| 檔案 | 內容 |
|---|---|
| `tokenize.ts` | `tokenize`：以空白分隔，`'` / `"` 內的空白不分隔；引號未閉合或出現在詞中時報錯 |
| `coerce.ts` | `coerce`：`true` / `false` / `null` / 數字自動轉型，其他保留為文字；引號內與 16 位 hex（uid）一律為文字 |
| `lookup.ts` | `list_commands`、`find_command`（同時查 `commands` 與 `op_templates`；`pack:指令` 或只寫指令名稱；找不到或同名屬於多個 pack 時報錯並列出候選）、`get_description` |
| `run.ts` | `run(target_world, context, line)`：cmd 呼叫 `execute(context, ...args)` 並回傳結果；op_template 呼叫 `create(target_world, ...args)` 產生 `rev_op`，經 `submit` 寫入歷史並回傳該 `rev_op` |
| `help.ts` | `help [指令]`：列出所有指令，或查詢單一指令 |
| `descriptions.ts` | `upstream_descriptions`：上游項目的描述常數表，鍵為 `pack:name` |

## 指令約定

- `core.cmd<C>.execute(context: C, ...args)`：context 由呼叫 `run` 的一方決定，`run` 原樣傳下去（human 選定）。`help` 與 camera 的 `view` 要求 context 為 world；test_ui 傳入 world。
- `core.op_template<W>.create(world: W, ...args)`：`W` 由各 pack 指定（通常是 `world.pure_world`），registry 內為 `unknown`（core 不能 import world，human 選定泛型）；模板，每次產生新的 `rev_op`；參數封在 `rev_op` 內，undo / redo 不再需要參數。
- 同一個 pack 的 `commands` 與 `op_templates` 不可同名，`compose` 時報錯。
- 描述：**上游**（cli 自身，以及比 cli 更接近 core 的 pack，例如 vanilla）由 cli 的 `upstream_descriptions` 常數表提供；上游 pack 不知道 cli，不寫 `other_info.cli`。**下游**（依賴 cli 的 pack）在 registry 的 `other_info.cli.description` 提供。兩者皆有或皆無時 `help` 報錯；新增上游指令時須同步補常數表。
- 解析輔助（草稿第 6 項：`parse_int`、`parse_vector`）與 2× 網格驗證由 `vanilla_beta` 提供，不在 cli 內。

## Todo

- 不掛到 DevTools Console（human 決定）；使用介面由 UI panel 提供（目前是 test_ui 的 cli panel）。
