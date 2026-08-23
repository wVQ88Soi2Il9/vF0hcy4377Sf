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

### 1 實作歷史分支刪除（Delete Branch）
- **state:** 待實作
- **basis:** → O1

在 Core 與 API 實作 `delete_branch` 機制，支援修剪指定分岔節點及其子樹，並妥善處理當前 HEAD 落在被刪除分支時的 LCA 回退跳轉；同步支援 CLI 與 UI 操作。

**沿革**

- H1 · 2026-08-24 03:32 決斷 —— 新增 Edit Branch 系列待辦，包含刪除分支（使用者）

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
