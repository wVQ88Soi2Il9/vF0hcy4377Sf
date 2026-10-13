# 0052_202608260133_cli-syntax-redesign-and-vector-tokens

- **status:** in-progress
- **prev:** ./0051_202608252208_cli-tool-pure-logic-core-registry.md
- **skill:** plan-history v3

## 主題簡述

全面檢討與重新設計 CLI 指令語法（告別 `--"<arg>"` 奇美拉格式），探討純位置參數風格下座標向量之解析方案（逗號聚合 vs 連續空格數字），並修復 `execute_command` 參數型別斷裂與註冊表適配問題。

---

## 觀察與推論

### O1 · 2026-08-26 01:33:00+08:00 — CLI 格式人因工程與 execute_command 型別斷裂
舊有 `cmd --"<arg1>" --"<arg2>"` 語法混用旗標與位置參數，輸入負擔過重。同時，CLI 分詞輸出的純字串直接灌入底層 Core 指令工廠，引發建構子型別錯誤與座標未轉型問題；歷程控制指令亦尚未完全註冊至 Core Registry。

### O2 · 2026-08-26 01:38:00+08:00 — 全新純位置參數與連續數字向量管線實裝完成
完成 `cli_tool` 全面重構：以純空格切分 Token，使用 `parse_vector` 將末端連續數字直接映射為 `number[]` 座標向量並依維度校驗，修復 `create_device` 查表轉譯類別與偶數座標檢查，並在 `executor.ts` 健全掛載所有歷程導航指令（`undo`, `redo`, `jump`, `prev-fork`, `next-fork`, `jump-root`, `jump-leaf`, `delete-node`）與標準 Pack 指令。

---

## 待辦

### 1 探討並評估全新 CLI 指令語法與向量解析方案 (CLI Syntax & Vector Parsing Evaluation)
- **state:** 完成
- **basis:** → O1, O2

評估由舊有 `--"<arg>"` 格式遷移至純位置參數語法之架構影響，深入比較「逗號聚合向量（`x,y,z`）」與「連續空格數字向量（`x y z`）」在 Tokenizer 管線、維度檢驗與維護性之權衡（參照 QA 0005，已定案採用空格連續數字向量）。

**沿革**

- H1 · 2026-08-26 01:06 提問 —— 指出 execute_command 失效且 --<arg> 格式反人類（human: wVQ88Soi2Il9）
- H2 · 2026-08-26 01:09 提問 —— 詢問為何不以分號分隔及其他格式流派（human: wVQ88Soi2Il9）
- H3 · 2026-08-26 01:31 回答 —— 提出維護者角度下連續空格數字配合固定維度的高效性（human: wVQ88Soi2Il9）
- H4 · 2026-08-26 01:33 回答 —— 建立 QA 0005 與 Plan 0052 列管語法討論，維持開放狀態不提前決策（agent: gemini-3.7-flash-medium） → O1
- H5 · 2026-08-26 01:36 決斷 —— 確定採用空格分隔之純位置參數語法與連續數字 4 4 0 向量格式（human: wVQ88Soi2Il9）
- H6 · 2026-08-26 01:38 落地 —— 完成 QA 0005 決策紀錄與 AGENTS.md 第 6 條規範修訂（agent: gemini-3.7-flash-high） → O2

### 2 修正 execute_command 參數轉型與指令適配器 (Fix execute_command & Adapter Pipeline)
- **state:** 完成
- **basis:** → O1, O2

修復 CLI 分詞字串與底層 `map_command_factory`（類別建構子、命名空間 ID、數值座標陣列）之間的型別落差，建立標準的查表解析與維度驗證管線。

**沿革**

- H1 · 2026-08-26 01:33 提問 —— 釐清 execute_command 參數型別轉換與適配器架構需求（agent: gemini-3.7-flash-medium） → O1
- H2 · 2026-08-26 01:38 落地 —— 重構 parser.ts 與 executor.ts，建立健全的裝置類別查表、向量維度驗證、偶數錨點校驗與動態指令分派（agent: gemini-3.7-flash-high） → O2

### 3 補齊 Runtime 歷程控制指令註冊至 Core Registry (Register History Commands in Core Registry)
- **state:** 等待確認
- **basis:** → O1, O2

將 `undo`, `redo`, `jump`, `prev-fork`, `next-fork`, `jump-root`, `jump-leaf`, `delete-branch`, `delete-node`, `pin` 等歷程操作正式註冊與接入 CLI 執行器，使 DevTools Console 與 UI CLI 面板皆可正常分派執行。

**沿革**

- H1 · 2026-08-26 01:33 提問 —— 盤點未註冊至 Core Registry 之 Runtime 歷程控制函式清單（agent: gemini-3.7-flash-medium） → O1
- H2 · 2026-08-26 01:38 落地 —— 在 executor.ts 與 help.ts 完整接入歷程樹導航與分支刪除指令，main.ts 初始化測試案例全面遷移至新語法並順暢執行（agent: gemini-3.7-flash-high） → O2
