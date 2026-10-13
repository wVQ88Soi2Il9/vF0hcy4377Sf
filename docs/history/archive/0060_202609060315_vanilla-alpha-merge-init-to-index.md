# 0060_202609060315_vanilla-alpha-merge-init-to-index

- **status:** in-progress
- **prev:** ./0059_202609060253_vanilla-alpha-operations-fail-fast-and-namespace.md
- **skill:** plan-history v3

## 主題簡述

將 `src/packs/vanilla_alpha/init.ts` 中的完整初始化邏輯（含 10 個核心 Hooks 宣告與世界事件轉發鏈）收斂整併入 `src/packs/vanilla_alpha/index.ts`，並移除 `init.ts` 消除重名覆蓋與死碼。

---

## 觀察與推論

### O1 · 2026-09-06 03:15:00+08:00 — 確立整併 init.ts 進入點至 index.ts
經由問答分析確認 `index.ts` 底部之簡化初始化函式覆蓋了 `init.ts`，使用者決策採納方案 B：
1. 將 `init.ts` 內容整合至 `index.ts`，恢復完整的 Hooks 宣告與事件注入。
2. 刪除 `init.ts`，消除重複與匯出覆蓋。

---

## 待辦

### 1 整併初始化邏輯至 index.ts 並刪除 init.ts (Merge init Logic into index.ts and Remove init.ts)
- **state:** 等待確認
- **basis:** → O1

在 `src/packs/vanilla_alpha/index.ts` 實作完整的 `global_init` 與 `world_init`，移除 `export * from './init';`，並刪除 `src/packs/vanilla_alpha/init.ts`。

**沿革**

- H1 · 2026-09-06 03:15 決斷 —— 確立採納方案 B 整併進入 index.ts（human: wVQ88Soi2Il9）
- H2 · 2026-09-06 03:15 落地 —— 完成 index.ts 整合完整 Hooks 宣告與世界事件轉發，並刪除 init.ts（agent: gemini-3.8-flash-high） → O1

### 2 驗證測試套件 (Verification with Test Suite)
- **state:** 等待確認
- **basis:** → O1

執行測試確保 `vanilla_alpha` 的各項功能與測試不受檔案結構調整影響。

**沿革**

- H1 · 2026-09-06 03:15 決斷 —— 執行測試驗證（human: wVQ88Soi2Il9）
- H2 · 2026-09-06 03:16 落地 —— 執行測試全數通過（agent: gemini-3.8-flash-high） → O1
