# 0011_202608190200_recipe-machine-decouple

- **status:** in-progress
- **prev:** 0010_202608131951_ghost-layer-half-open.md
- **skill:** plan-history v3

## 主題簡述

重構配方（Recipe）與機器（Machine / Device）架構：解除機器對靜態配方清單的依賴，並將配方設計為可接收機器屬性（ID、Type、Tag、Power、Position 等上下文）進行動態評估的函式化模型。

## 觀察與推論

### O1 · 2026-08-19 02:00:00+08:00 — 機器與靜態配方耦合之侷限
目前 `device_definition` 硬編碼 `recipe_ids: string[]`，導致機器與配方產生強相依，限制了配方的動態判定與跨 Pack 擴充彈性。

### O2 · 2026-08-19 02:00:00+08:00 — 函式化動態配方模型
將 Recipe 設計為接受機器上下文（如 ID、Type、Tags、Power、Position 等）作為引數的函式架構，可動態計算相容性、生產時間、消耗/產出與能源變化。

### O3 · 2026-08-19 03:02:00+08:00 — 通用函式優先（General Function First）設計策略
將 Recipe 核心設計為最高彈性的動態函式模型（TypeScript 模組），確立以函式評估的通用架構。未來若有純宣告式配置需求，可再實作適配器轉為函式，讓通用函式涵蓋特例資料。

### O4 · 2026-08-20 02:03:00+08:00 — 採用 UID 反查簡化評估介面
確立精簡原則，不引入額外的 context 包裝物件與多餘抽象，直接以裝置 `uid` 配合地圖與註冊表反查裝置資訊進行評估，避免過度設計。

## 待辦

### 1 解耦 Machine 與 Recipe 靜態相依
- **state:** 完成
- **basis:** → O1

移除 `device_definition` 中的靜態 `recipe_ids` 硬耦合，使機器（Machine / Device）架構獨立於配方，並支援動態配方查詢機制。

**沿革**
- H1 · 2026-08-19 02:00 決斷 —— 確定解除 Machine 對 Recipe 的靜態綁定 → O1
- H2 · 2026-08-19 02:05 落地 —— 移除 device_definition.recipe_ids 與 JSON 欄位 → O1

### 2 實作 Recipe 函式化架構與動態上下文評估
- **state:** 完成
- **needs:** 0011#1
- **basis:** → O2, O4

以 `uid` 配合反查機制進行 Recipe 動態評估，不做多餘封裝：
1. 核心型別定義（recipe, recipe_evaluation, recipe_fn）
2. 核心註冊與評估機制（依 uid 反查計算可用性與產出）
3. Pack 載入器動態化（recipes/*.ts 掃描與 Adapter 相容）
4. API 公開邊界擴充與生命週期整合
5. basic_ui / test pack 實作與畫面驗證
6. 計畫沿革與 HEAD 狀態同步

**沿革**
- H1 · 2026-08-19 02:00 決斷 —— 確定 Recipe 改為接收機器屬性引數的函式化架構 → O2
- H2 · 2026-08-19 03:02 決斷 —— 確立「通用函式優先，JSON 視為 Adapter」架構，推動 Recipe 模組函式化 → O2, O3
- H3 · 2026-08-19 03:52 決斷 —— 確立 6 步驟實作與整合路徑 → O2, O3
- H4 · 2026-08-20 02:03 決斷 —— 確定採用 UID 反查簡化架構，不引入額外 context 封裝 → O4
- H5 · 2026-08-20 02:20 落地 —— 完成 Recipe 函式化核心型別、UID 評估機制、動態掃描與 UI 整合 → O2, O4

### 3 實作宣告式 JSON Recipe 相容 Adapter
- **state:** 待實作
- **needs:** 0011#2
- **basis:** → O3

實作宣告式 JSON 配方轉函式化 Recipe 之 Adapter 機制，使純資料配置之 JSON 配方（如 `data/recipes.json`）能無縫相容並轉換為通用動態函式模型。

**沿革**
- H1 · 2026-08-20 02:15 決斷 —— 依指示將 JSON Adapter 獨立為後續待辦事項 → O3
