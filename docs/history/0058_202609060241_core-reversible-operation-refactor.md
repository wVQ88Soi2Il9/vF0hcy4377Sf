# 0058_202609060241_core-reversible-operation-refactor

- **status:** in-progress
- **prev:** ./0057_202609050412_cli-help-and-describe.md
- **skill:** plan-history v3

## 主題簡述

重構 Core 層 `src/core/definition_iii.ts`：取消 `reversible_operation_factory`，將 `reversible_operation` 的 `execute` 與 `inverse` 方法簽名擴充支援 `...args: any[]`，並將 `pack_module.operations` 調整為 `Record<string, reversible_operation>`。同步修訂 `src/packs/vanilla_alpha/query.ts` 之 `get_operation` 回傳型別，並補充單元測試。

---

## 觀察與推論

### O1 · 2026-09-06 02:41:00+08:00 — 確立可逆操作契約放寬與下游型別對齊
經 /grill-me 深入訪談確立核心決策：
1. 移除 `reversible_operation_factory`，直接由 `reversible_operation` 介面承載可逆操作：
   `export interface reversible_operation extends namespaced_id { execute(sp: space,...args: any[]): void; inverse(sp: space,...args: any[]): void; other_info?: Record<string, unknown>; }`。
2. `pack_module.operations` 型別調整為 `Record<string, reversible_operation>`，與 `commands` 保持物件介面對稱。
3. `history.ts` 保持純粹的 `op.execute(sp)` 重放機制，`...args` 視為選填擴充。
4. `src/packs/vanilla_alpha/query.ts` 之 `get_operation` 同步回傳 `core.reversible_operation`。

---

## 待辦

### 1 重構 Core definition_iii 取消 factory 並更新 reversible_operation 介面 (Core Reversible Operation Refactor)
- **state:** 等待確認
- **basis:** → O1

在 `src/core/definition_iii.ts` 移除 `reversible_operation_factory`，更新 `reversible_operation` 支援 `...args: any[]`，並調整 `pack_module.operations` 型別為 `Record<string, reversible_operation>`。

**沿革**

- H1 · 2026-09-06 02:37 決斷 —— 確立取消 reversible_operation_factory 並放寬 execute/inverse 參數（human: wVQ88Soi2Il9）
- H2 · 2026-09-06 02:41 決斷 —— 確立 pack_module.operations 為 Record<string, reversible_operation>（human: wVQ88Soi2Il9）
- H3 · 2026-09-06 02:44 落地 —— 完成 definition_iii.ts 移除 factory、放寬 execute/inverse 參數並更新 pack_module.operations（agent: gemini-3.8-flash-high） → O1

### 2 同步修訂 vanilla_alpha query 工具函式型別 (Sync vanilla_alpha query get_operation Type)
- **state:** 等待確認
- **basis:** → O1

在 `src/packs/vanilla_alpha/query.ts` 將 `get_operation` 之回傳型別由 `core.reversible_operation_factory` 更新為 `core.reversible_operation`。

**沿革**

- H1 · 2026-09-06 02:41 決斷 —— 確立 get_operation 回傳 core.reversible_operation 保持對稱性（human: wVQ88Soi2Il9）
- H2 · 2026-09-06 02:44 落地 —— 完成 vanilla_alpha/query.ts 中 get_operation 回傳型別更新為 core.reversible_operation（agent: gemini-3.8-flash-high） → O1

### 3 補充可逆操作 ...args 特性之單元測試 (Unit Test for ...args Trailing Arguments)
- **state:** 等待確認
- **basis:** → O1

在 `tests/reversible_operation.test.ts` 新增單元測試，驗證可逆操作接受額外參數之執行、撤銷及與 `world` / `history` 的相容性。

**沿革**

- H1 · 2026-09-06 02:41 決斷 —— 建立 ...args 單元測試防護（human: wVQ88Soi2Il9）
- H2 · 2026-09-06 02:45 落地 —— 建立 tests/reversible_operation.test.ts 並完成 3 項測試驗證全數通過（agent: gemini-3.8-flash-high） → O1
