# 0047_202608240341_optimize-shirones-ui

- **status:** in-progress
- **prev:** ./0046_202608240333_history-edit-branch-and-node-tags.md
- **skill:** plan-history v3

## 主題簡述

全面優化 `src/packs/shirones_ui` 模組之架構、程式碼行數與渲染效能。
消除高度重複的手動 DOM 構建、內嵌 SVG 圖標與重複按鈕狀態檢查；將拓撲排版演算法與 UI 生命週期清晰分工，在 100% 維持現有美術視覺效果與互動體驗的前提下大幅提升代碼簡潔度與維護性。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，Pack 僅透過 `@/API` 與 `@/utils/*` 存取。
- 100% 保持現有所有 UI 美術視覺、主題色彩與互動功能不變。
- 拒絕隱性補齊。

## 規劃描述

1. **抽離導航按鈕與 SVG 構建模組**：
   - 將 `history_tree_panel.ts` 中收合條與頂部工具列重複手動建立的 6 大跳轉按鈕（Root、Prev Fork、Undo、Redo、Next Fork、Leaf）與 SVG 圖標抽象為資料驅動的定義陣列與按鈕工廠。
   - 統一跳轉按鈕的啟用/禁用狀態判斷邏輯，杜絕雙重判斷。
2. **重構與精簡 `history_tree_panel.ts` 拓撲排版與渲染**：
   - 模組化或重構 `compute_git_graph_layout`、SVG S 曲線繪製與節點行 DOM 構建邏輯，將 750+ 行的巨大檔案大幅瘦身至約 250~300 行。
3. **檢查與優化其他面板組件**：
   - 檢視 `info_panel.ts`、`device_creator.ts`、`viewport_panel.ts`、`cli_panel.ts` 中的 DOM 構建與事件綁定，清理重複邏輯。
4. **驗證與建構**：
   - 確保所有 UI 操作、折疊/展開動畫、Git Graph 節點跳轉、按鈕禁用狀態與畫布互動均維持 100% 正常。

## 觀察與推論

### O1 · 2026-08-24 03:41:00+08:00 — shirones_ui 代碼膨脹與模組重構需求
`src/packs/shirones_ui/history_tree_panel.ts` 目前長達 753 行，主因為導航按鈕在收合側邊條與展開工具列中各自手動構造了一次（重複寫了 12 顆按鈕的 SVG 與 12 次事件綁定/狀態檢查），加上 SVG 與 DOM 的逐行手動建立。透過資料驅動抽象與模組化重構，可在不影響任何美術視覺的前提下顯著降低複雜度。

## 待辦

### 1 抽離導航按鈕定義與共用按鈕工廠
- **state:** 待實作
- **basis:** → O1

將 6 大歷史跳轉按鈕（Root, PrevFork, Undo, Redo, NextFork, Leaf）之圖標 SVG、標題、跳轉動作與可用性條件（can_execute）收斂為資料定義陣列，提供統一的按鈕群組生成與狀態同步函式。

**沿革**

- H1 · 2026-08-24 03:41 決斷 —— 新增優化 shirones_ui 計畫（使用者）

### 2 重構與大幅精簡 history_tree_panel.ts
- **state:** 待實作
- **basis:** → O1

利用共用按鈕工廠重構 `history_tree_panel.ts`，精簡 SVG 繪製與節點行 DOM 構建邏輯，將檔案體積大幅縮減並提高可讀性。

**沿革**

- H1 · 2026-08-24 03:41 決斷 —— 新增優化 shirones_ui 計畫（使用者）

### 3 檢視並優化 shirones_ui 其餘面板組件
- **state:** 待實作
- **basis:** → O1

檢視 `info_panel.ts`、`device_creator.ts`、`viewport_panel.ts` 等模組，精簡重複之 DOM 生成代碼與事件監聽。

**沿革**

- H1 · 2026-08-24 03:41 決斷 —— 新增優化 shirones_ui 計畫（使用者）
