# 0041_202608231523_decouple-basic-ui-and-shirones-ui

- **status:** done
- **prev:** ./0040_202608231408_draggable-splitters-layout.md
- **skill:** plan-history v3

## 主題簡述

將 basic_ui 模組拆解重構，使 basic_ui 僅保留 UI 核心框架與基底元件（如 Panel 基底、Splitter 分割器、Layout 容器、擴充註冊點 Extension Registry 等），並將具體的 UI 面板與業務邏輯（如 CLI 終端、History Tree 歷史樹、Device Card / Inspector、Viewport Panel、特定風格樣式）移交解耦至獨立的 UI Pack（例如 shirones_ui）。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- Packs 禁止直接 import `@/core`，只能透過 `@/API` 存取。
- 遵循單向依賴與 Rely-Pack 規範（`$<pack>/`）。
- 拒絕隱性補齊。
- 更新後執行 `python docs/history/update-head.py`。

## 規劃描述

1. **定義 basic_ui 核心框架邊界 (UI Core Framework)**：
   - 保留基礎元件與抽象：`panel.ts` (基礎 Panel 與 Dock/Floating 機制)、`splitter.ts` (分割條)、`layout.ts` (佈局容器與宿主掛載)、`extensions.ts` (擴充與外掛槽點)。
   - 提供標準的 UI 註冊與掛載介面，供外部 UI Pack 注入面板與自訂視圖。
2. **建立/拆分具體 UI Pack（如 `shirones_ui`）**：
   - 將具體業務面板（`history_tree_panel.ts`、`cli_panel.ts`、`cli_executor.ts`、`info_panel.ts`、`viewport_panel.ts`、`device_card.ts`、`device_creator.ts`）移至 `shirones_ui` 或相應的專屬模組/Pack。
   - 透過 `basic_ui` 提供的擴充機制與 Layout API 進行註冊與裝配。
3. **更新樣式與相依性解耦**：
   - 將 `style.css` 拆分為 basic 框架通用重設/佈局樣式與 shirones 主題/元件樣式。
4. **驗證與測試**：
   - 確保所有 UI 面板與互動功能運作如常，建構無報錯。

## 觀察與推論

### O1 · 2026-08-23 15:23:06+08:00 — basic_ui 拆解與框架化需求
使用者指示：把 basic_ui 拆解，basic_ui 應該留下框架，剩下的應該交給別的 pack（例如 shirones_ui）。

## 待辦

### 1 定義 basic_ui 框架核心介面與擴充槽點
- **state:** 完成
- **basis:** → O1

梳理 basic_ui 的職責邊界，保留 Panel、Splitter、Layout 與 Extension 機制，確立純粹的 UI 框架介面與物件導出。

**沿革**

- H1 · 2026-08-23 15:23 決斷 —— 開立計畫拆解 basic_ui 並確立框架架構（使用者）
- H2 · 2026-08-23 15:27 落地 —— 完成 basic_ui 框架化重構，導出核心元件、佈局容器與擴充鉤子，精簡樣式表（Agent） → O1

### 2 建立 shirones_ui Pack 並遷移具體面板與業務元件
- **state:** 完成
- **basis:** → O1

建立 `src/packs/shirones_ui/`，將 CLI Panel、History Tree Panel、Info Panel、Viewport Panel、Device Card / Creator 等具體面板與相關樣式遷移至 `shirones_ui`，並向 `basic_ui` 註冊。

**沿革**

- H1 · 2026-08-23 15:23 決斷 —— 開立計畫遷移具體面板至 shirones_ui（使用者）
- H2 · 2026-08-23 15:27 落地 —— 建立 shirones_ui Pack 並完成所有具體業務面板與主題樣式遷移及掛載（Agent） → O1

### 3 整合測試與建構驗證
- **state:** 完成
- **basis:** → O1

驗證 basic_ui 框架與 shirones_ui 的加載、事件通訊與拖曳渲染功能，確保架構清晰且編譯無誤。

**沿革**

- H1 · 2026-08-23 15:23 決斷 —— 開立計畫進行整合與驗證（使用者）
- H2 · 2026-08-23 15:28 落地 —— 通過 Vite 快速單檔打包建構驗證，全部模組載入正常（Agent） → O1
