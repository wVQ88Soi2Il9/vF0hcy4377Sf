# 0036_202608230258_api-get-dimension-helper

- **status:** done
- **prev:** ./0035_202608230234_core-map-dimension-property.md
- **skill:** plan-history v3

## 主題簡述

於 `@/API` 與 `runtime.ts` 提供 `get_dimension()` / `get_dim()` 輔助函式，直接取得當前活躍地圖的空間維度數，消除下游模組重複執行 `get_map()?.dimension` 的樣板代碼。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 保持 Single Source of Truth，由 runtime `_map.dimension` 提供。
- 透過 `npm run build` 驗證。

## 規劃描述

1. **於 `runtime.ts` 與 `API.ts` 實作 `get_dimension()` / `get_dim()`**：
   - 封裝 `_map?.dimension` 讀取邏輯。
2. **重構下游使用點**：
   - 在 `base_cuboid_device`、`basic_renderer`、`basic_ui` 等處使用 `get_dimension()`。
3. **驗證與建構**：
   - 執行 `npm run build` 確認編譯通過。

## 觀察與推論

### O1 · 2026-08-23 02:58:23+08:00 — API 提供 get_dimension 需求
使用者指示：
每次都要傳入或讀取 game_map 過於繁瑣，API 應提供 `get_dim` / `get_dimension` 直接取得維度。

## 待辦

### 1 實作 get_dimension() 並重構下游
- **state:** 完成
- **basis:** → O1

於 `runtime.ts` 與 `API.ts` 導出 `get_dimension()` / `get_dim()`，並更新下游使用點。

**沿革**

- H1 · 2026-08-23 02:58 決斷 —— 開立待辦於 API 增加 get_dimension 函式（使用者）
- H2 · 2026-08-23 02:59 落地 —— 於 runtime.ts 與 API.ts 導出 get_dimension / get_dim 並重構 base_cuboid_device，通過建構（Agent） → O1
