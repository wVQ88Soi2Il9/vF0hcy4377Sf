# panel_demo

## 目的

驗收 `panel` 用的示範 pack：宣告 4 個 panel，並提供一份版面樹。不含任何遊戲功能，驗收完可從 `ENABLED_PACKS` 移除。

## Code

| 內容 | 說明 |
|---|---|
| `panels` | `explorer`、`world`、`log`、`inspector` 四個 panel 宣告，註冊在 `other_info.panel.panels` |
| `layout` | 左 explorer（可收合）、中間上下切成 world / log（log 可收合）、右 inspector（可收合） |
| `wire_controls(root)` | 把 world 區塊裡的 `toggle …` 按鈕接到對應 panel 的 `collapse` / `expand` |
| `manifest` | `{ pack_id: 'panel_demo' }` |
