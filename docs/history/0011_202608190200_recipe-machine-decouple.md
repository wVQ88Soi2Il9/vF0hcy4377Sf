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
將 Recipe 核心設計為最高彈性的動態函式模型（TypeScript 模組），確立以 `machine_context` 評估的通用架構。未來若有純宣告式配置需求，可再實作 `json_to_recipe_fn` 適配器轉為函式，讓通用函式涵蓋特例資料。

## 待辦

### 1 解耦 Machine 與 Recipe 靜態相依
- **state:** 完成
- **basis:** → O1

移除 `device_definition` 中的靜態 `recipe_ids` 硬耦合，使機器（Machine / Device）架構獨立於配方，並支援動態配方查詢機制。

**沿革**
- H1 · 2026-08-19 02:00 決斷 —— 確定解除 Machine 對 Recipe 的靜態綁定 → O1
- H2 · 2026-08-19 02:05 落地 —— 移除 device_definition.recipe_ids 與 JSON 欄位 → O1

### 2 實作 Recipe 函式化架構與動態上下文評估
- **state:** 待實作
- **needs:** 0011#1
- **basis:** → O2, O3

將 Recipe 改為接收機器上下文（包含 machine id, type, tags, power, position 等引數）之函式模型，動態評估配方可用性、輸入輸出與能源轉換；Pack recipes 轉向動態 TS 模組。

**沿革**
- H1 · 2026-08-19 02:00 決斷 —— 確定 Recipe 改為接收機器屬性引數的函式化架構 → O2
- H2 · 2026-08-19 03:02 決斷 —— 確立「通用函式優先，JSON 視為 Adapter」架構，推動 Recipe 模組函式化 → O2, O3
