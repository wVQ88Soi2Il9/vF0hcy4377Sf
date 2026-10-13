# cli

## 目的

把一行字串轉成對 registry 中指令的呼叫，並提供 `--help`。CLI 不內建任何業務指令，指令由各 pack 在 registry 條目的 `commands` 中註冊。

## Code

| 檔案 | 內容 |
|---|---|
| `index.ts` | `global_init` 只註冊 `{ pack_id: 'cli' }`；`world_init` 為空 |
| `parser.ts` | `tokenize_input`（空白分詞，雙引號內視為同一 token）、`parse_vector`、`parse_integer` |
| `executor.ts` | `execute_command`、`set_console_registry`、`execute_in_console`、`register_console_cli` |
| `help.ts` | `generate_help`、`get_command_describe`（讀 `other_info.cli.describe`） |

### 執行規則（依現有程式）

- 語法：`<command> [args...]`、`--help`、`--help <command>`、`--help <namespace>:<command>`。
- 參數轉型：`true` / `false` / `null`、可轉為數字者轉為 number，其餘保留字串。
- 查找：`namespace:id` 指定 pack；不帶 namespace 時依 registry 順序遍歷。每個 pack 先找 `commands`，再找 `operations`。
- 呼叫：目標是函式則 `target(...args)`，否則 `target.execute(...args)`。
- `register_console_cli(registry)` 把 runner 掛到 `globalThis.cli`。

## Todo

以下是現況觀察與未決事項，未修改。

- **operation 與 command 在 CLI 的處理未決**：現在兩者一起查找，並以 `execute(...args)` 呼叫。但 `rev_op.execute` 需要 `space`，CLI 沒有提供，所以直接以 CLI 呼叫 operation 的行為未定義。
- **registry 的 `operations` 存實例還是 factory 未決**（見 `vanilla_alpha`）。
- `--help` 後面接 2 個以上參數時，不會報用法錯誤，而是落到指令查找，結果是 `Command "--help" not found in registry.`。
- `parse_vector`、`parse_integer`、`register_console_cli`、`set_console_registry` 在 `src/` 內沒有其他呼叫處。
- `src/main.ts` 的 `ENABLED_PACKS` 目前沒有啟用 `cli`。
- `world_init` 為空函式，且 `global_init` 沒有把它放進 registry 條目（見 `vanilla_alpha` 的 Todo）。
