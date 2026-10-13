# 0039_202608231358_canvas-viewport-panel

- **status:** done
- **prev:** ./0038_202608230439_scrollable-div-canvas-viewport.md
- **skill:** plan-history v3

## 主題簡述

將 Canvas 視口重構為獨立的浮動 Panel 視窗（`viewport_panel`），預設水平置左垂直置中，封裝 Canvas 畫布，並於標題列整合 Zoom 縮放功能（`−`、`百分比`、`+`、`⟲ 重置`）。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- Packs 禁止直接 import `@/core`，只能透過 `@/API` 存取。
- 拒絕隱性補齊。
- 更新後執行 `python docs/history/update-head.py`。

## 規劃描述

1. **實作 Viewport Panel 模組 (`src/packs/basic_ui/viewport_panel.ts`)**：
   - 建立 `viewport_panel`，定位於水平置左、垂直置中（`top: 50%; left: 16px; transform: translateY(-50%);`）。
   - 於 Header 建立 Zoom 控制群組（`−`、`百分比`、`+`、`⟲ 重置`）。
2. **更新 UI Layout 與 Styles (`src/packs/basic_ui/layout.ts`, `style.css`, `index.ts`)**：
   - 將 `<canvas>` 掛載於 `viewport_panel.content_element`。
   - `ResizeObserver` 動態更新 Canvas 尺寸。
3. **更新 basic_renderer 相機控制器 (`src/packs/basic_renderer/index.ts`)**：
   - 提供相機狀態快照與縮放控制函式，雙向同步 Zoom 數值。
4. **驗證與建構**：
   - 執行 `npm run build` 確認編譯通過。

## 觀察與推論

### O1 · 2026-08-23 13:54:53+08:00 — Canvas 改為獨立 Panel 需求
使用者指示：希望 renderer 的 canvas 也是一種 panel，預設水平置左垂直置中，並提供 Zoom 縮放功能。

## 待辦

### 1 實作 Viewport Panel 視窗與 Zoom 控制列
- **state:** 完成
- **basis:** → O1

實作 `viewport_panel.ts`，將 Canvas 封裝在浮動 Panel 內，預設水平置左垂直置中，並於標題列提供 Zoom 縮放控制。

**沿革**

- H1 · 2026-08-23 13:58 決斷 —— 開立計畫實作 Viewport Panel 視窗與 Zoom 控制（使用者）
- H2 · 2026-08-23 13:59 落地 —— 完成 Viewport Panel 獨立浮動面板、Header Zoom 控制列與 Canvas 自適應，通過建構驗證（Agent） → O1
