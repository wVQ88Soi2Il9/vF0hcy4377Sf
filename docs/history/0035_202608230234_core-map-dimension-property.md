# 0035_202608230234_core-map-dimension-property

- **status:** done
- **prev:** ./0034_202608230221_cuboid-device-pack.md
- **skill:** plan-history v3

## 主題簡述

於核心 `game_map` 資料結構增加 `dimension: number` 屬性（代表空間維度 $N$），並於 `create_map` 中自動同步計算，消除下游程式碼對 `map.size.length` 的反覆冗餘調用。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 拒絕隱性補齊，保持 Single Source of Truth。
- 嚴格更新 Plan History 並通過建構。

## 規劃描述

1. **核心型別擴充 (`src/core/types.ts`)**：
   - 於 `game_map` 介面增加 `readonly dimension: number`。
2. **核心 Map Manager 實作 (`src/core/map_manager.ts`)**：
   - 於 `create_map(size: vector)` 自動給予 `dimension: size.length`。
3. **下游調用點全面替換**：
   - 將 `basic_renderer`、`basic_ui`（`cli_executor`、`device_creator`）、`layered_2d` 等處之 `map.size.length` 替換為 `map.dimension`。
4. **驗證與建構**：
   - 執行 `npm run build` 確認編譯通過並完成 Git Commit。

## 觀察與推論

### O1 · 2026-08-23 02:33:03+08:00 — core 新增 dimension 需求
使用者指示：
core 應具備 dimension 屬性，以避免整個專案反覆使用 `map.size.length`。

## 待辦

### 1 於 core 增加 map.dimension 並全面替換下游 map.size.length
- **state:** 完成
- **basis:** → O1

於 `src/core/types.ts` 及 `src/core/map_manager.ts` 增加 `dimension: number`，並重構下游所有調用點。

**沿革**

- H1 · 2026-08-23 02:34 決斷 —— 開立待辦於 core 增加 map.dimension 並替換下游使用點（使用者）
- H2 · 2026-08-23 02:35 落地 —— 於 core/types.ts 與 map_manager.ts 實作 map.dimension 並替換下游所有使用點，通過建構（Agent） → O1
