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

### 6 Vanilla / Pack 層實作 delete_branch 演算法
- **state:** 完成
- **承接:** 0046#4
- **basis:** → O1

基於 `delete_node` 於 `src/packs/vanilla/history.ts` 實作 `delete_branch(target_uid)` 並由 `vanilla` 匯出；若目標子樹包含當前活躍路徑（`current_uid`）或為 Root 節點則拒絕刪除；由下而上多次呼叫 `delete_node` 依序修剪子樹節點。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#4 核心演算法實作（使用者）
- H2 · 2026-08-25 01:14 決斷 —— 確立 delete branch = 多次 delete node 架構（使用者）
- H3 · 2026-08-25 01:46 落地 —— 在 src/packs/vanilla/history.ts 實作 delete_branch 演算法並於 vanilla pack 匯出 → O1

### 7 CLI 實作 delete-branch 指令
- **state:** 等待確認
- **承接:** 0046#4
- **basis:** → O1

在 `src/packs/shirones_ui/cli_executor.ts` 實作 `delete-branch --"<uid>"` 指令；解析參數並呼叫 `delete_branch`，針對 Root 節點與活躍分支提供明確報錯訊息，並更新 help 說明。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#4 CLI 指令實作（使用者）
- H2 · 2026-08-25 01:49 落地 —— 在 src/packs/shirones_ui/cli_executor.ts 實作 delete-branch 指令與活躍分支保護提示 → O1

### 8 Shirones UI 實作分支刪除按鈕與互動
- **state:** 完成
- **承接:** 0046#4
- **basis:** → O1

在 `src/packs/shirones_ui/history_tree_panel.ts` 節點行 DOM 提供「刪除分支 🗑️」按鈕；若為當前活躍分支或 Root 節點自動禁用按鈕，點擊執行 `delete_branch` 並刷新 Git Graph。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#4 UI 介面實作（使用者）
- H2 · 2026-08-25 01:54 落地 —— 在 src/packs/shirones_ui/history_tree_panel.ts 節點列實作刪除分支按鈕與活躍分支防護 → O1

### 9 Core 與 API 實作 delete_node 演算法
- **state:** 完成
- **承接:** 0046#5
- **basis:** → O1

在 `src/core/history_manager.ts` 實作唯一的 `delete_node(tree, target_uid)` 演算法與 `src/API.ts` 匯出；不分類模式，若子節點為空則直接移除，若有子節點則自動就地重新掛載至 `parent_node`；若為 Root 節點或當前節點（`target_uid === current_uid`）嚴格拒絕刪除。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#5 核心演算法實作（使用者）
- H2 · 2026-08-25 01:14 決斷 —— 確立 delete_node 唯一基礎演算法（無子節點直接刪除、有子節點自動就地嫁接）（使用者）
- H3 · 2026-08-25 01:18 落地 —— 在 src/core/history_manager.ts 與 src/API.ts 實作 delete_node 演算法 → O1

### 10 CLI 實作 delete-node 指令
- **state:** 等待確認
- **承接:** 0046#5
- **basis:** → O1

在 `src/packs/shirones_ui/cli_executor.ts` 實作 `delete-node --"<uid>"` 指令；解析參數並呼叫 `delete_node`，針對 Root 節點與當前節點提供明確報錯訊息，並更新 help 說明。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#5 CLI 指令實作（使用者）
- H2 · 2026-08-25 01:41 落地 —— 在 src/packs/shirones_ui/cli_executor.ts 實作 delete-node 指令與防呆錯誤提示 → O1

### 11 Shirones UI 實作單節點刪除按鈕與互動
- **state:** 完成
- **承接:** 0046#5
- **basis:** → O1

在 `src/packs/shirones_ui/history_tree_panel.ts` 節點行 DOM 提供「刪除節點 ✂️」按鈕；若為當前節點或 Root 節點自動禁用按鈕，點擊執行 `delete_node` 並刷新 Git Graph。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#5 UI 介面實作（使用者）
- H2 · 2026-08-25 01:41 落地 —— 在 src/packs/shirones_ui/history_tree_panel.ts 節點行實作刪除按鈕與點擊連動 → O1
- H3 · 2026-08-25 01:44 落地 —— 支援在歷史節點行直接滑鼠右鍵刪除節點（左鍵跳轉、右鍵刪除）→ O1

### 12 歷史刪除功能之單元測試與端到端驗證
- **state:** 完成
- **承接:** 0046#5
- **basis:** → O1

建立完整測試腳本驗證 `delete_branch` 與 `delete_node` 之各層邏輯：活躍分支防護、當前節點防護、Root 防護、子樹修剪、子節點嫁接以及 UI/CLI 呼叫正確性。

**沿革**

- H1 · 2026-08-25 01:08 決斷 —— 承接 0046#5 測試驗證任務（使用者）

### 2 實作歷史節點釘選與高亮（Pin / Highlight Nodes）
- **state:** 完成
- **basis:** → O1

在 Vanilla / Pack 層實作歷史節點釘選管理（`src/packs/vanilla/history.ts`，不修改 Core）；支援透過 CLI（`pin --"<uid>"`）與 UI 釘選按鈕（📌）切換節點釘選狀態，由 UI 決定預設與高亮色彩，並於 Git Graph 時間軸呈現金黃光暈邊框與圓點高亮樣式。

**沿革**

- H1 · 2026-08-24 03:32 決斷 —— 新增節點標記、釘選與高亮待辦（使用者）
- H2 · 2026-08-25 02:07 落地 —— 在 src/packs/vanilla/node_highlight.ts 實作節點高亮管理、CLI highlight 指令與 UI 星號高亮切換/金黃光暈樣式（不改動 Core）→ O1
- H3 · 2026-08-25 02:11 落地 —— 整合至 src/packs/vanilla/history.ts，改為由 UI 決定高亮色彩、CLI 實作 pin 指令與 UI 釘選按鈕（📌）與高亮呈現 → O1
- H4 · 2026-08-25 02:13 落地 —— CLI pin 指令新增 --"list" 選項，支援列出所有釘選節點與動作標籤 → O1

### 3 實作歷史分支合併（Merge Branch）
- **state:** 移交
- **移交:** 0046#13、0046#14、0046#15、0046#16
- **basis:** → O1

設計並實作分支合併演算法，支援將來源分支的變更指令序列依序應用並合併至目標分支（生成 Merge Node 或 Squash Replay），連動 CLI 與 UI Git Graph 拓撲線條展示。

**沿革**

- H1 · 2026-08-24 03:32 決斷 —— 新增分支合併機制待辦（使用者）
- H2 · 2026-08-25 02:30 決斷 —— 確立放置於 vanilla 層，採嚴格原子性 3-Way 衝突檢測（兩端同時歧異修改同一裝置時判定衝突報錯，空間重疊不列衝突）（human: wVQ88Soi2Il9）
- H3 · 2026-08-25 02:36 拆格 —— 細拆為 0046#13（Vanilla/API）、0046#14（CLI）、0046#15（UI）、0046#16（測試）

### 13 Vanilla 層實作 merge_branch 演算法與 3-Way 衝突檢測
- **state:** 移交
- **移交:** 0046#17、0046#18、0046#19、0046#20
- **承接:** 0046#3
- **basis:** → O1

在 `src/packs/vanilla/history.ts` 實作 `merge_branch(source_uid, target_uid?)` 演算法並由 `vanilla` 匯出；支援 Fast-forward、三方衝突檢測（嚴格檢測兩端同時修改同一裝置或目標裝置已被刪除，空間重疊不列衝突）、UID 重映射與複合指令（Composite Merge Command）封裝。

**沿革**

- H1 · 2026-08-25 02:36 決斷 —— 承接 0046#3 演算法核心實作任務（human: wVQ88Soi2Il9）
- H2 · 2026-08-25 02:46 拆格 —— 細拆為 0046#17（路徑與差異分析）、0046#18（3-Way 衝突檢測）、0046#19（UID 重映射與重放）、0046#20（複合指令與主流程整合）

### 17 歷史節點型別擴充與三方路徑提取器（Path Extractor）
- **state:** 等待確認
- **承接:** 0046#13
- **basis:** → O1

在 `src/core/types.ts` 將 `map_command.label` 更正為標準 `id: string`（附帶 `other_info`），並擴充 `history_node.other_info?: Record<string, unknown>`；於 `src/packs/vanilla/history.ts` 實作三方路徑提取器（`extract_branch_path`），提取 $\text{LCA} \to S$ 與 $\text{LCA} \to T$ 的節點與指令序列（零字串解析），並支援標準 `vanilla` 命名空間（移除 `$` 前綴，參閱 QA 0002）之 `pinned` 與 `merged_from` 元資料存取。

**沿革**

- H1 · 2026-08-25 02:46 決斷 —— 承接 0046#13 型別擴充與差異分析模組（human: wVQ88Soi2Il9）
- H2 · 2026-08-25 03:04 落地 —— 更正 map_command.id，擴充 history_node.other_info，實作 extract_branch_path 路徑提取器，徹底移除字串正則剖析（agent: gemini-3.7-flash） → O1
- H3 · 2026-08-25 03:10 決斷 —— 確立命名空間 4 大型態與 other_info[pack_id] 擴充標準（移除 $ 前綴），紀錄於 docs/QA/0002（human: wVQ88Soi2Il9）
- H4 · 2026-08-25 03:14 決斷 —— 全面重構為結構化 namespaced_id（{ pack, id }）與兩層 Map 階層註冊表（Map<pack, Map<id, T>>），支援 O(1) Mod 卸載（human: wVQ88Soi2Il9）

### 18 3-Way 衝突檢測器（3-Way Conflict Detector）
- **state:** 等待確認
- **承接:** 0046#13
- **basis:** → O1

在 `src/packs/vanilla/history.ts` 實作嚴格原子性 3-Way 衝突檢測函式：比對來源分支與目標分支相對於 LCA 的差異集，若檢測到雙端同時修改同一裝置（座標歧異或配方歧異）或來源端嘗試修改/刪除已被目標端刪除的裝置，判定為衝突並生成詳細衝突報告；空間重疊則放行不列衝突。

**沿革**

- H1 · 2026-08-25 02:46 決斷 —— 承接 0046#13 衝突檢測模組（human: wVQ88Soi2Il9）
- H2 · 2026-08-25 03:17 落地 —— 在 src/packs/vanilla/history.ts 實作 aggregate_branch_mutations 與 check_merge_conflicts 嚴格原子性衝突檢測器並由 vanilla 匯出（agent: gemini-3.7-flash） → O1

### 19 UID 重映射與指令轉換重放器（UID Remapping & Command Replayer）
- **state:** 待實作
- **承接:** 0046#13
- **basis:** → O1

在 `src/packs/vanilla/history.ts` 實作 UID 重映射與指令重放機制：維護 `source_to_target_uid_map`，將來源分支建立裝置分配到的新 UID 記錄並精準轉換後續的 `move`、`select_recipe` 與 `delete` 指令，生成一組適用於目標地圖狀態的全新可逆指令序列。

**沿革**

- H1 · 2026-08-25 02:46 決斷 —— 承接 0046#13 重映射與指令重放模組（human: wVQ88Soi2Il9）

### 20 複合合併指令封裝與 merge_branch 主流程整合（Composite Command & Orchestration）
- **state:** 待實作
- **承接:** 0046#13
- **basis:** → O1

在 `src/packs/vanilla/history.ts` 實作 `composite_map_command`（正向依序執行、反向由後往前撤銷）與 `merge_branch(source_uid, target_uid?)` 完整調度主流程：整合 Fast-forward、衝突檢測、UID 重映射重放與 Merge 節點寫入（設定 `merged_from_uid` 並觸發 history 變更 Hook），由 `vanilla` 匯出。

**沿革**

- H1 · 2026-08-25 02:46 決斷 —— 承接 0046#13 複合指令與主流程調度模組（human: wVQ88Soi2Il9）

### 14 CLI 實作 merge 指令與參數解析
- **state:** 待實作
- **承接:** 0046#3
- **basis:** → O1

在 `src/packs/shirones_ui/cli_executor.ts` 實作 `merge --"<source_uid>" [--"<target_uid>"]` 指令；解析參數並呼叫 `merge_branch`，針對 Fast-forward、合併衝突與非法節點提供明確提示與報錯，並更新 help 說明。

**沿革**

- H1 · 2026-08-25 02:36 決斷 —— 承接 0046#3 CLI 指令實作任務（human: wVQ88Soi2Il9）

### 15 Shirones UI 實作分支合併按鈕與 Git Graph 雙親拓撲線條
- **state:** 待實作
- **承接:** 0046#3
- **basis:** → O1

在 `src/packs/shirones_ui/history_tree_panel.ts` 節點行 DOM 提供「合併分支 🔀」按鈕（若為活躍路徑或祖先節點自動禁用），並在 Git Graph SVG 渲染中繪製雙親合併匯入弧線（Merge Curves）與標記 `MERGE` 徽章。

**沿革**

- H1 · 2026-08-25 02:36 決斷 —— 承接 0046#3 UI 介面實作任務（human: wVQ88Soi2Il9）

### 16 歷史分支合併功能之整合測試與驗證
- **state:** 待實作
- **承接:** 0046#3
- **basis:** → O1

建立測試腳本驗證 `merge_branch` 之各情境：Fast-forward、分歧分支合併、UID 重映射連續操作、3-Way 衝突拒絕、Undo/Redo 完整性以及 UI/CLI 呼叫正確性。

**沿革**

- H1 · 2026-08-25 02:36 決斷 —— 承接 0046#3 測試驗證任務（human: wVQ88Soi2Il9）

