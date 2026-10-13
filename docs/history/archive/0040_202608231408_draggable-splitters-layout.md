# 0040_202608231408_draggable-splitters-layout

- **status:** done
- **prev:** ./0039_202608231358_canvas-viewport-panel.md
- **skill:** plan-history v3

## 主題簡述

將 UI 升級為可互動拖曳調整大小的分割窗格佈局（Splitter / Resizable Panes），提供 1 條垂直分割線（左右寬度）與 2 條水平分割線（上/中/下高度），支援即時拖拽調整與畫布解析度自適應。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- Packs 禁止直接 import `@/core`，只能透過 `@/API` 存取。
- 拒絕隱性補齊。
- 更新後執行 `python docs/history/update-head.py`。

## 規劃描述

1. **實作 Splitter 控制模組 (`src/packs/basic_ui/splitter.ts`)**：
   - 建立水平與垂直分割線控制器，處理滑鼠拖曳、游標與邊界限制。
2. **重構 UI Layout 與 Styles (`src/packs/basic_ui/layout.ts`, `style.css`)**：
   - 外層水平 Flex Container（左側欄 + 垂直分割線 + 右側欄）。
   - 內層垂直 Flex Container（History Tree + 水平分割線 1 + Viewport + 水平分割線 2 + CLI）。
3. **驗證與建構**：
   - 執行 `npm run build` 確認編譯通過。

## 觀察與推論

### O1 · 2026-08-23 14:06:57+08:00 — 窗格分割線拖曳需求
使用者指示：希望將 16×9 佈局升級為可以拖動調整窗格大小的樣子（選項 A：Splitter 分割線）。

## 待辦

### 1 實作可拖曳分割線控制器與 Flex 佈局
- **state:** 完成
- **basis:** → O1

實作 `splitter.ts`，重構 `layout.ts` 與 `style.css`，實現垂直與水平分割線的實時拖曳調整。

**沿革**

- H1 · 2026-08-23 14:08 決斷 —— 開立計畫實作可拖曳分割線佈局（使用者）
- H2 · 2026-08-23 14:09 落地 —— 完成 Splitter 分割條元件、雙層 Flex 佈局與自適應樣式，通過建構驗證（Agent） → O1
