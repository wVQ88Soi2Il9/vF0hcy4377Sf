# test_ui

## 目的

測試用的介面，用來確認 panel、cli 與 history 能接在一起運作。不是正式 UI。

## Code

| 檔案 | 內容 |
|---|---|
| `ui.ts` | 三個 panel 與版面：左 `history`、中 `view`、右 `cli`；`mark` 操作模板；committed 時重畫 history |
| `index.ts` | manifest：`op_templates.mark`、`other_info.panel.panels`、`create_state`（每個 world 的 refresh 清單）、`on['core:committed']` |

## 行為

- `cli`：輸入一行按 Enter 呼叫 `cli.run`，顯示結果；錯誤以紅字顯示。
- `history`：以縮排列出整棵 history tree，`●` 為目前節點；點節點跳過去；上方有 undo、redo、root、leaf。
- `view`：佔位。renderer 尚未實作（`basic_renderer`、`camera` 只有 draft）。
- `mark [label]`：不改 space 的操作，只為了在 history 產生節點。

## Todo

- 中間換成 renderer 的畫面（等 `basic_renderer` 與 `camera` 實作）。
- 目前沒有可建立的裝置類別，`create_device` 等指令在 app 內無法成功。
