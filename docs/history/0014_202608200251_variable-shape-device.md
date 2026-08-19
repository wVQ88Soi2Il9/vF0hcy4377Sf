# 0014_202608200251_variable-shape-device

- **status:** draft
- **prev:** 0011_202608190200_recipe-machine-decouple.md
- **skill:** plan-history v3

## 主題簡述

支援可變形裝置（Variable-Shape Device / 動態 Shape）：擴充裝置形狀純靜態假設，允許管線（Pipe）等裝置具備動態長度與形狀，滿足玩家拖曳延伸與整根操作需求。

**本計畫的約束**

- 純靜態裝置定義（Static Device）維持完全相容，不受破壞。
- 所有形狀擴充需維持單向依賴架構與嚴格型別定義。

## 規劃描述

1. **核心架構與型別擴充**：支援 Device 動態 Shape 覆寫（如 `shape_fn` 或 `other_info` 實例定義），更新 `get_world_cells` 等幾何運算。
2. **API 與操作語意**：評估與提供裝置縮放/變形操作（如 `resize_device`）及相關生命週期 Hooks。
3. **Loader 與註冊機制**：支援可變形裝置模組化註冊（TypeScript 動態定義或 Loader Adapter）。
4. **規則與文檔同步**：修訂 `docs/conventions.md` 與 `docs/architecture.md` 相關座標與靜態資料規範。

## 觀察與推論

### O1 · 2026-08-20 02:51:21+08:00 — 純靜態 Shape 難以支援拖曳式管線
現有 `device_definition.shape` 寫死於 `data/devices.json`，裝置實例僅有 `position` 與 `rotation`。但管線裝置長度由玩家放置時拖曳決定，靜態形狀無法表達動態格數，若拆成 1x1 裝置（方案 2）則難以自然達成整根選取/拖曳/刪除。

### O2 · 2026-08-20 02:51:21+08:00 — 採納方案 1（可變形 Device）作為架構擴充
經方案評估與業界（如 Satisfactory）傳送帶/管線設計參考，管線在資料層應視為「單一實體 + 變形參數」。此決定為刻意之架構擴充（類似 0011 Recipe 函式化），純靜態 Device 依然合法，新增支援動態 Device。

## 待辦

### 1 決斷 Shape 覆寫機制與 Core 型別定義
- **state:** 待決斷
- **basis:** → O1、O2

決斷具體型別設計：是採用函式化計算（如 `device_definition.shape_fn(dev) => vector[]`）還是實例屬性覆寫（如 `device.other_info` 儲存動態 shape），以及 `core/types.ts` 與 `src/utils/device_utils.ts`（`get_world_cells`）的支援方式。

**沿革**

- H1 · 2026-08-20 02:51 決斷 —— 確立採用方案 1（可變形 Device），待決斷具體型別設計（使用者）

### 2 決斷 API 變形操作與 Hook 機制
- **state:** 待決斷
- **basis:** → O2

決斷是否於 `API.ts` 與 `map_manager.ts` 新增專用操作（如 `resize_device`），或在既有更新流程處理；並確認 Hooks 命名與觸發時機（例如 `on_device_resize` 或是複用 `on_device_change`）。

**沿革**

- H1 · 2026-08-20 02:51 決斷 —— 提出 API 操作與 Hook 擴充議題待決斷（使用者）

### 3 決斷 Loader 掃描與註冊方式
- **state:** 待決斷
- **basis:** → O2

決斷可變形 Device 的註冊路徑：是否維持 JSON 靜態配置並搭配動態 Adapter，抑或比照 Recipe 函式化支援 TS 程式碼註冊（如 `packs/*/devices/*.ts`）。

**沿革**

- H1 · 2026-08-20 02:51 決斷 —— 提出 Loader 掃描與註冊設計待決斷（使用者）

### 4 決斷 Port 座標與 Grid 架構影響
- **state:** 待決斷
- **basis:** → O1、O2

評估管線長度變化時 Port（接口）座標與連通性之動態計算規則，並決斷是否需修訂 `docs/architecture.md` 的 Grid & Port 座標章節。

**沿革**

- H1 · 2026-08-20 02:51 決斷 —— 提出 Port 動態計算與架構文檔調整待決斷（使用者）

### 5 決斷 Conventions 規範修訂
- **state:** 待決斷
- **basis:** → O2

決斷是否修訂 `docs/conventions.md`（縮小 Rule 2/4 適用範圍至純靜態 Device，並增列可變形 Device 之開發規範）。

**沿革**

- H1 · 2026-08-20 02:51 決斷 —— 提出 conventions 規範調整待決斷（使用者）
