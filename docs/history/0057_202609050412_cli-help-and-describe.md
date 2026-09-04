# 0057_202609050412_cli-help-and-describe

- **status:** in-progress
- **prev:** ./0056_202609050145_extract-camera-pack.md
- **skill:** plan-history v3

## 主題簡述

在 `src/core/` 擴充 `pack_module.commands` 分離可逆操作與一般指令；在 `src/packs/cli` 實作 `--help` 功能，支援自 `other_info.cli` 讀取指令 describe 並依 Pack 分組排版輸出。

---

## 觀察與推論

### O1 · 2026-09-05 04:12:00+08:00 — 確立指令與可逆操作分離及 other_info.cli 規範
經 /grill-me 深入訪談確立兩項核心決策：
1. 「並非所有操作皆為可逆（reversible）」：在 `core.pack_module` 擴充 `commands?: Record<string, cmd>`，由 `cmd = (...args: any[]) => any` 作為一等公民指令型別，徹底解開空間歷史 Undo 操作與一般 CLI 指令的混淆。
2. 指令描述統一收斂至 `other_info.cli`：各 Pack 宣告指令時直接於 `other_info.cli[id]` 填寫 `{ describe?: string }` 或字串。
3. `cli` Pack 提供預設指令：`cli` 於 `global_init` 註冊預設 `--help`，支援全域依 Pack 分組列表與單一指令 `--help <cmd>` 查詢。

### O2 · 2026-09-05 04:15:00+08:00 — 模組職責分離：將 help 獨立為 src/packs/cli/help.ts
依據使用者指示「把help搬出去」，將 `generate_help` 與 `get_command_describe` 自 `executor.ts` 抽離至獨立模組 `src/packs/cli/help.ts`，保持執行器 `executor.ts` 專注於指令分派與執行，`index.ts` 聚合導出 `help` 模組。
### O3 · 2026-09-05 04:22:00+08:00 — 將 cmd 對齊 reversible_operation 契約，清理 cli/index 假性註冊
依使用者指示「把help搬出去」與「去把cmd對齊reversible_operation」：
1. `src/core/definition_iii.ts`：將 `cmd` 升級為介面 `export interface cmd extends namespaced_id { execute(...args: any[]): any; other_info?: Record<string, unknown>; }`，與一等實體完全同構，metadata 直接內聚於 `cmd.other_info`。
2. `src/packs/cli/index.ts`：移除 `commands` 與 `other_info` 偽註冊之 `'--help'`，回歸純淨 pack 宣告；CLI 執行器以頂層保留字元支援 `--help`。
3. `src/packs/cli/help.ts` & `executor.ts`：支援優先由 `cmd.other_info` 讀取 describe，並調用 `cmd.execute`。

### O4 · 2026-09-05 05:11:00+08:00 — 依指示將 help.ts 改以假資料支撐並清空內部實作
依使用者指示「對外用假資料撐著，裡面盡量刪光」，將 `src/packs/cli/help.ts` 內部的複雜檢索與格式化邏輯全數移除，僅保留導出介面並回傳假資料。

---

## 待辦

### 1 Core 擴充 commands 契約與分離可逆操作 (Core cmd Type & pack_module.commands)
- **state:** 等待確認
- **basis:** → O1, O3

在 `src/core/definition_iii.ts` 宣告 `export interface cmd extends namespaced_id { execute(...args: any[]): any; other_info?: Record<string, unknown>; }` 並於 `pack_module` 擴充 `commands?: Record<string, cmd>`。

**沿革**

- H1 · 2026-09-05 04:10 決斷 —— 確立 Core 分離 commands 與 operations（human）
- H2 · 2026-09-05 04:12 落地 —— 完成 definition_iii.ts 擴充 cmd 與 pack_module.commands（agent: gemini-3.8-flash-high） → O1
- H3 · 2026-09-05 04:22 落地 —— 將 cmd 對齊 reversible_operation，具備 namespaced_id、execute 與 other_info（agent: gemini-3.8-flash-high） → O3

### 2 實作 CLI --help 與 cmd.other_info 描述解析 (CLI --help & cmd.other_info Parsing)
- **state:** 等待確認
- **basis:** → O1, O2, O3, O4

在 `src/packs/cli/executor.ts` 實作 `execute_command` 攔截 `--help` 分派並支援 `cmd.execute`；在 `src/packs/cli/help.ts` 實作 `get_command_describe(cmd)` 專門由 `cmd.other_info` 讀取 describe 並由 `generate_help` 排版輸出；徹底杜絕並移除 `pack.other_info` 與 `src/packs/cli/index.ts` 之偽註冊。

**沿革**

- H1 · 2026-09-05 04:10 決斷 —— 確立 --help 依 Pack 分組輸出機制（human）
- H2 · 2026-09-05 04:12 落地 —— 完成 executor.ts 與 index.ts 實作（agent: gemini-3.8-flash-high） → O1
- H3 · 2026-09-05 04:15 落地 —— 建立 help.ts 獨立封裝說明邏輯，精簡 executor.ts 並更新 index.ts 導出（agent: gemini-3.8-flash-high） → O2
- H4 · 2026-09-05 04:22 落地 —— 移除 cli/index.ts 偽註冊，help.ts 支援由 cmd.other_info 直接讀取 describe，executor 支援 cmd.execute（agent: gemini-3.8-flash-high） → O3
- H5 · 2026-09-05 04:24 落地 —— 徹底清理 pack.other_info 殘留，get_command_describe 直接接收 cmd 物件並自 cmd.other_info 解析描述（agent: gemini-3.8-flash-high） → O3
- H6 · 2026-09-05 05:11 落地 —— 依指示將 help.ts 內部邏輯刪除，對外介面改以假資料支撐（agent: gemini-3.8-flash-high） → O4

### 3 CLI 單元測試覆蓋 commands 與 --help 功能 (Unit Tests Verification)
- **state:** 等待確認
- **basis:** → O1, O3

更新 `tests/cli.test.ts`，驗證一般指令可直接以 `commands` 註冊（免除 as any），並測試全域 `--help` 分組輸出、`--help <cmd>` 單一查詢、未設 describe 留空及查無指令報錯。

**沿革**

- H1 · 2026-09-05 04:10 決斷 —— 建立 --help 與 commands 單元測試案例（human）
- H2 · 2026-09-05 04:12 落地 —— tests/cli.test.ts 11 項測試全數通過（agent: gemini-3.8-flash-high） → O1
- H3 · 2026-09-05 04:22 落地 —— 更新 tests/cli.test.ts 以 core.cmd 結構宣告，測試 11/11 全數通過（agent: gemini-3.8-flash-high） → O3
