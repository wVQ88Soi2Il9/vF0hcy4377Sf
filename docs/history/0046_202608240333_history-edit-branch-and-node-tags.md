# 0046_202608240333_history-edit-branch-and-node-tags

- **status:** in-progress
- **prev:** ./0045_202608240327_clean-shirones-ui-code-and-css.md
- **skill:** plan-history v3

## 主題簡述

設計並實作歷史分支編輯與節點標記管理功能（History Branch Editing & Node Tagging/Pinning），包含：
1. **刪除分支 (Delete Branch)**：支援刪除指定非主幹/非活躍分支或特定歷史子樹。
2. **節點標記/釘選/高亮 (Mark / Tag / Highlight / Pin Nodes)**：允許使用者對歷史節點進行客製命名、標記 Tag、標記高亮顏色或釘選（Pin）關鍵檢查點（Milestone）。
3. **合併分支 (Merge Branch)**：支援將不同歷史分支的操作歷史或狀態進行合併重播（Fast-forward / 3-way Merge / Squash Merge），並於 UI Git Graph 時間軸與 CLI 指令提供完整整合支援。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，Core 保持單純資料結構與純演算法，透過 `@/API` 暴露介面，Pack 負責 UI/CLI 呈現。
- 拒絕隱性補齊。

## 規劃描述

1. **Core / API 層擴充**：
   - 在 `history_node` / `history_tree` 擴充支援 `tags?: string[]`, `pinned?: boolean`, `custom_label?: string`, `color?: string` 等標記欄位。
   - 實作 `delete_branch(tree, target_node_uid)` 演算法：清理指定節點及其子分支，安全處理當前 `current_uid` 的 fallback 跳轉。
   - 實作 `mark_node(tree, node_uid, options)` API：支援加標籤、釘選、改標籤與顏色。
   - 實作 `merge_branch(tree, source_uid, target_uid)` 演算法：合併分支節點指令至目標分支。
2. **CLI 整合**：
   - 擴充 CLI 指令：`branch --"delete" --"<uid>"`, `tag --"<uid>" --"<tag_name>"`, `pin --"<uid>"`, `merge --"<source_uid>" --"<target_uid>"`.
3. **UI Git Graph 時間軸整合 (`shirones_ui`)**：
   - 在 Git Graph 時間軸右側顯示 Tag / Pin 徽章（Badge），支援高亮節點。
   - 提供節點右鍵選單或快速動作按鈕：標記 Tag、釘選 Pin、刪除該分支 Delete Branch、合併分支 Merge Branch。
4. **驗證與建構**：
   - 驗證分支刪除後樹結構完整性、標記持久化以及分支合併之指令重放效果。

## 觀察與推論

### O1 · 2026-08-24 03:32:08+08:00 — 歷史分支編輯與節點管理需求
隨著專案發展與非線性分支累積，使用者需要更強大的版本控制能力：清理無用分支（Delete Branch）、為里程碑節點打 Tag/Pin 釘選高亮、以及合併不同分支的探索進度（Merge Branch）。

## 待辦

### 1 實作歷史分支與節點刪除（Delete Branch & Delete Node）
- **state:** 移交
- **移交:** 0046#4、0046#5
- **basis:** → O1

在 Core 與 API 實作 `delete_branch`（修剪子樹）與 `delete_node`（單節點剔除與子節點重新掛載）雙機制，妥善處理當前 HEAD 的倒帶與重播跳轉；同步支援 CLI 指令與 UI 操作。

**沿革**

- H1 · 2026-08-24 03:32 決斷 —— 新增 Edit Branch 系列待辦，包含刪除分支（使用者）
- H2 · 2026-08-25 01:05 改題 —— 擴充涵蓋單節點剔除（原題：實作歷史分支刪除（Delete Branch））
- H3 · 2026-08-25 01:05 決斷 —— 確定同時實作分支刪除 (Delete Branch) 與單節點剔除嫁接 (Delete Node)（使用者）
- H4 · 2026-08-25 01:07 拆格 —— 拆分為 0046#4（Delete Branch）與 0046#5（Delete Node）

### 4 實作歷史分支刪除（Delete Branch）
- **state:** 移交
- **移交:** 0046#6、0046#7、0046#8
- **承接:** 0046#1
- **basis:** → O1

在 Core 與 API 實作 `delete_branch` 機制，支援修剪指定節點及其所有子孫節點；若目標節點位於當前活躍分支（為當前 HEAD 或其祖先）或為 Root 節點時嚴格拒絕刪除；同步支援 CLI（`delete-branch --"<uid>"`）與 UI 操作。

**沿革**

- H1 · 2026-08-25 01:07 決斷 —— 承接 0046#1 分支刪除任務，明定拒絕刪除當前活躍分支/HEAD（使用者）
- H2 · 2026-08-25 01:08 拆格 —— 細拆為 0046#6（Core/API）、0046#7（CLI）、0046#8（UI）

### 5 實作歷史單節點刪除與嫁接（Delete Node）
- **state:** 移交
- **移交:** 0046#9、0046#10、0046#11、0046#12
- **承接:** 0046#1
- **basis:** → O1

在 Core 與 API 實作 `delete_node` 機制，支援剔除單一節點並將其所有子節點就地重新掛載至父節點；若目標節點為當前 HEAD（`target_uid === current_uid`）或為 Root 節點時嚴格拒絕刪除；同步支援 CLI（`delete-node --"<uid>"`）與 UI 操作。

**沿革**

- H1 · 2026-08-25 01:07 決斷 —— 承接 0046#1 單節點刪除任務，明定拒絕刪除當前節點（使用者）
- H2 · 2026-08-25 01:08 拆格 —— 細拆為 0046#9（Core/API）、0046#10（CLI）、0046#11（UI）、0046#12（測試）

### 6 Core 與 API 實作 delete_branch 演算法
- **state:** 待實作
- **承接:** 0046#4
- **basis:** → O1

基於 `delete_node` 實作 `delete_branch(tree, target_uid)` 與 `src/API.ts` 匯出；若目標子樹包含當前活躍路徑（`current_uid`）或為 Root 節點則拒絕刪除；由下而上多次呼叫 `delete_node` 依序修剪子樹節點。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#4 核心演算法實作（使用者）
- H2 · 2026-08-25 01:14 決斷 —— 確立 delete branch = 多次 delete node 架構（使用者）

### 7 CLI 實作 delete-branch 指令
- **state:** 待實作
- **承接:** 0046#4
- **basis:** → O1

在 `src/packs/shirones_ui/cli_executor.ts` 實作 `delete-branch --"<uid>"` 指令；解析參數並呼叫 `delete_branch`，針對 Root 節點與活躍分支提供明確報錯訊息，並更新 help 說明。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#4 CLI 指令實作（使用者）

### 8 Shirones UI 實作分支刪除按鈕與互動
- **state:** 待實作
- **承接:** 0046#4
- **basis:** → O1

在 `src/packs/shirones_ui/history_tree_panel.ts` 節點行 DOM 提供「刪除分支 🗑️」按鈕；若為當前活躍分支或 Root 節點自動禁用按鈕，點擊執行 `delete_branch` 並刷新 Git Graph。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#4 UI 介面實作（使用者）

### 9 Core 與 API 實作 delete_node 演算法
- **state:** 實作中
- **承接:** 0046#5
- **basis:** → O1

在 `src/core/history_manager.ts` 實作唯一的 `delete_node(tree, target_uid)` 演算法與 `src/API.ts` 匯出；不分類模式，若子節點為空則直接移除，若有子節點則自動就地重新掛載至 `parent_node`；若為 Root 節點或當前節點（`target_uid === current_uid`）嚴格拒絕刪除。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#5 核心演算法實作（使用者）
- H2 · 2026-08-25 01:14 決斷 —— 確立 delete_node 唯一基礎演算法（無子節點直接刪除、有子節點自動就地嫁接）（使用者）
- H3 · 2026-08-25 01:18 落地 —— 在 src/core/history_manager.ts 與 src/API.ts 實作 delete_node 演算法 → O1

### 10 CLI 實作 delete-node 指令
- **state:** 待實作
- **承接:** 0046#5
- **basis:** → O1

在 `src/packs/shirones_ui/cli_executor.ts` 實作 `delete-node --"<uid>"` 指令；解析參數並呼叫 `delete_node`，針對 Root 節點與當前節點提供明確報錯訊息，並更新 help 說明。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#5 CLI 指令實作（使用者）

### 11 Shirones UI 實作單節點刪除按鈕與互動
- **state:** 待實作
- **承接:** 0046#5
- **basis:** → O1

在 `src/packs/shirones_ui/history_tree_panel.ts` 節點行 DOM 提供「刪除節點 ✂️」按鈕；若為當前節點或 Root 節點自動禁用按鈕，點擊執行 `delete_node` 並刷新 Git Graph。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#5 UI 介面實作（使用者）

### 12 歷史刪除功能之單元測試與端到端驗證
- **state:** 待實作
- **承接:** 0046#5
- **basis:** → O1

建立完整測試腳本驗證 `delete_branch` 與 `delete_node` 之各層邏輯：活躍分支防護、當前節點防護、Root 防護、子樹修剪、子節點嫁接以及 UI/CLI 呼叫正確性。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#5 測試驗證任務（使用者）

### 2 實作歷史節點標記、釘選與高亮（Mark / Tag / Highlight / Pin Nodes）
- **state:** 待實作
- **basis:** → O1

擴充 `history_node` 元資料，支援使用者自定義 Tag、釘選（Pin）重要里程碑與高亮特定節點；並於 Git Graph 時間軸即時呈現標籤徽章與快速跳轉。

**沿革**

- H1 · 2026-08-24 03:32 決斷 —— 新增節點標記、釘選與高亮待辦（使用者）

### 3 實作歷史分支合併（Merge Branch）
- **state:** 待實作
- **basis:** → O1

設計並實作分支合併演算法，支援將來源分支的變更指令序列依序應用並合併至目標分支（生成 Merge Node 或 Squash Replay），連動 CLI 與 UI Git Graph 拓撲線條展示。

**沿革**

- H1 · 2026-08-24 03:32 決斷 —— 新增分支合併機制待辦（使用者）
