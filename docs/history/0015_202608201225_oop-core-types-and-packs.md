# 0015_202608201225_oop-core-types-and-packs

- **status:** done
- **prev:** 0014_202608200251_variable-shape-device.md
- **skill:** plan-history v3

## 主題簡述

實驗性 OOP（物件導向）架構升級：
1. `core/types.ts` 中的 `device`、`device_definition` 與 `recipe` 升級為輕量 OOP 類別模型（`device_instance`, `device_definition_base`, `recipe_base`）。
2. 維持 Core 引擎極致簡潔（保持零外部依賴、零具體遊戲邏輯）。
3. 重寫全新的 `test` pack，將裝置與配方改以 OOP 類別（`assembler_device`, `iron_gear_recipe` 等）直接宣告，毋需舊版 Adapter。

## 觀察與推論

### O1 · 2026-08-20 12:25:00+08:00 — 實驗性 OOP 試用與 Core 簡潔性
在實驗性分支 `dev/0820` 試用 OOP，Core 層僅提供輕量的基礎型別與類別骨架（`device_instance`, `device_definition_base`, `recipe_base`），讓 Packs 能夠大膽使用繼承與多型擴充裝置與配方邏輯，同時不需撰寫舊版相容 Adapter。

## 待辦

### 1 升級 Core Types 支援 OOP 類別架構
- **state:** 完成
- **basis:** → O1

於 `core/types.ts` 引入 `device_definition_base`、`device_instance` 與 `recipe_base`，並保持 Core 的極致簡潔。

**沿革**
- H1 · 2026-08-20 12:25 落地 —— 完成 core/types 與 API.ts 的 OOP 導出 (Agent)

### 2 重寫 Test Pack 為原生 OOP 架構
- **state:** 完成
- **basis:** → O1

將 `packs/test` 的裝置與配方改為 TypeScript 類別直接繼承 `device_definition_base` 與 `recipe_base`，並透過 loader 直接掃描註冊。

**沿革**
- H1 · 2026-08-20 12:25 落地 —— 建立 packs/test/devices/ 與 packs/test/recipes/ 原生 OOP 模組 (Agent)

### 3 統一 Pack 依賴單向規範與 Loader 支援
- **state:** 完成
- **basis:** → O1

確保所有 packs 僅依賴 `@/API`，並升級 `loader.ts` 支援直接載入 OOP 裝置與配方模組。

**沿革**
- H1 · 2026-08-20 12:25 落地 —— 完成 loader.ts 與 basic_renderer / vanilla 依賴修正 (Agent)
