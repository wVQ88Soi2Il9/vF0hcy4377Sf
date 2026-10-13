# 0016_202608210125_complete-vanilla-pack

- **status:** done
- **prev:** `./0015_202608201746_device-abstract-class-oop.md`
- **skill:** plan-history v3

## 主題簡述

在 OOP 裝置多型架構下，補全 `packs/vanilla` 基礎遊戲邏輯包，包含專屬型別定義、空間碰撞與越界檢查（`overlap`）、連接圖建構（`graph`），並透過 `@/API` 註冊引擎 Hook 與統一物件導出。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，`packs/vanilla` 僅透過 `@/API` 與 Core 互動，嚴禁直接 import `@/core`。
- 拒絕隱性補齊，向量運算嚴格匹配維度。
- Pack 對外暴露之 API 採用物件導出（`export const vanilla = { ... }`）。

## 規劃描述

1. **型別定義 (`src/packs/vanilla/types.ts`)**：定義 `map_validation_result`（`out_of_bounds`, `overlapped`）與 `device_node`（`uid`, `previous_nodes`, `next_nodes`）。
2. **空間碰撞與越界檢查 (`src/packs/vanilla/overlap.ts`)**：實作 `is_out_of_bounds` 與 `check_map_overlap`，支援多維空間與 `dev.get_shape()` 多型計算，使用 `spatial_map` 偵測重複佔用與邊界出界。
3. **裝置連接圖建構 (`src/packs/vanilla/graph.ts`)**：實作 `build_device_graph`，透過 `dev.get_port('input' | 'output')` 與 `spatial_map` 進行世界座標連接埠匹配，產生有向圖節點清單。
4. **Pack 整合與 Hook 註冊 (`src/packs/vanilla/index.ts`)**：統一導出 `vanilla` 物件，並於 `init_pack()` 透過 `register_overlap_check` 與 `register_graph_build` 註冊引擎 Hook。

## 觀察與推論

### O1 · 2026-08-21 01:25:37+08:00 — OOP 多型架構下之 Vanilla 計算重塑
在 0015 計畫完成 Device 抽象類別重構後，裝置形狀與連接埠已由 `device.get_shape()` 與 `device.get_port(type)` 成員方法封裝。Vanilla 的空間檢查與圖形建構邏輯不再依賴外部全域查表，而是透過多型呼叫裝置實體方法並結合世界座標 `add_vector(dev.position, local)` 進行運算。

## 待辦

### 1 建立 Vanilla Pack 型別與碰撞越界檢查模組
- **state:** 完成
- **basis:** → O1

於 `src/packs/vanilla/types.ts` 定義 `map_validation_result` 與 `device_node`；於 `src/packs/vanilla/overlap.ts` 實作 `is_out_of_bounds` 及 `check_map_overlap`。

**沿革**

- H1 · 2026-08-21 01:25 決斷 —— 確立 Vanilla Pack 型別與 overlap 模組實作規格（使用者）
- H2 · 2026-08-21 01:26 落地 —— 建立 types.ts 與 overlap.ts 完成邊界及碰撞檢查邏輯 → O1

### 2 建立 Vanilla Pack 連接圖建構模組
- **state:** 完成
- **basis:** → O1

於 `src/packs/vanilla/graph.ts` 實作 `build_device_graph`，透過 `dev.get_port('input')` 與 `dev.get_port('output')` 搭配 `spatial_map` 建立有向連接圖。

**沿革**

- H1 · 2026-08-21 01:25 決斷 —— 確立基於多型 get_port 的連接圖建構演算法（使用者）
- H2 · 2026-08-21 01:26 落地 —— 實作 graph.ts 之 build_device_graph 連接圖建構演算法 → O1

### 3 整合 Vanilla Pack 導出與 Hook 註冊
- **state:** 完成
- **basis:** → O1

於 `src/packs/vanilla/index.ts` 導出 `vanilla` API 物件，並在 `init_pack()` 呼叫 `register_overlap_check` 與 `register_graph_build` 註冊至引擎 Hook。

**沿革**

- H1 · 2026-08-21 01:25 決斷 —— 確立 vanilla 物件導出與 init_pack 註冊 Hook（使用者）
- H2 · 2026-08-21 01:26 落地 —— 更新 vanilla/index.ts 完成 API 物件導出與 Hook 自動註冊 → O1
