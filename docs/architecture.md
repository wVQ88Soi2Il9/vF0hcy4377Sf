# 系統架構設計 (Architecture)

---

## 三層單向架構 (Three-Layer Architecture)

依賴方向：`packs` → `utils` → `core`（**嚴格單向，禁止反向依賴**）

```
src/
├── core/                   # 層 1：引擎核心
│   ├── types.ts            # 全域型別（game_map, device, port…）
│   ├── hooks.ts            # Hook 擴充點（所有副作用的唯一入口）
│   ├── map_manager.ts      # 地圖狀態 CRUD
│   ├── pack_manager.ts     # Pack 生命週期管理
│   └── index.ts
├── utils/                  # 層 2：純函數工具庫
│   ├── math.ts             # 向量、座標運算
│   ├── spatial_map.ts      # 空間索引
│   └── device_utils.ts     # Device 衍生計算
├── API.ts                  # 公開 API 邊界（pack 的唯一合法入口）
├── main.ts                 # 應用啟動點
└── packs/                  # 層 3：遊戲邏輯 / 渲染 / UI（均為 Mod）
    ├── loader.ts           # 掃描 & 呼叫所有 pack 的 init_pack()
    ├── basic_renderer/     # 內建基礎渲染 pack
    │   ├── index.ts
    │   ├── draw_device.ts
    │   ├── draw_grid.ts
    │   ├── draw_registry.ts
    │   └── types.ts
    ├── vanilla/            # 內建基礎遊戲邏輯 pack
    │   ├── index.ts
    │   ├── overlap.ts
    │   └── graph.ts
    └── test/               # 測試用 pack（開發期）
```

---

## 各層職責

### 層 1 — Core（引擎核心）

*   **型別定義**：`game_map`、`device`、`device_port` 等全域型別的唯一來源（Single Source of Truth）。
*   **Hook 系統**：`hooks.ts` 是所有副作用的唯一擴充點。Core 不含任何具體遊戲邏輯。
*   **地圖狀態**：`map_manager.ts` 管理設備的 CRUD，呼叫後觸發對應 Hook。
*   **禁止**：import 任何 pack、直接執行遊戲規則。

### 層 2 — Utils（工具庫）

*   純函數，無副作用，無狀態。
*   可被 core 或 packs 引用。
*   **禁止**：import `@/core/hooks` 或任何 pack。

### 層 3 — Packs（插件層）

*   所有遊戲規則、渲染邏輯、UI 均在此層，以 pack 形式存在。
*   只能透過 `@/API` 與引擎互動。
*   **禁止**：直接 import `@/core/*`（API.ts 除外）、跨 pack 直接互相 import（**unknown** — pack 間通訊機制尚未定義）。

---

## API 邊界（`src/API.ts`）

`API.ts` 是 Core 對 Pack 層的唯一公開介面。Pack 只能用這裡匯出的函式。

| 函式 | 用途 |
|------|------|
| `create_device()` | 新增設備至地圖 |
| `delete_device()` | 刪除設備 |
| `move_device()` | 移動設備 |
| `on_device_create(cb)` | 訂閱設備建立事件 |
| `on_device_delete(cb)` | 訂閱設備刪除事件 |
| `on_device_move(cb)` | 訂閱設備移動事件 |
| `on_device_change(cb)` | 訂閱任何設備生命週期變動 |
| `register_overlap_check(fn)` | 註冊碰撞/越界檢查 Hook |
| `register_graph_build(fn)` | 註冊連接圖建構 Hook |

> ⚠️ **unknown**：`register_device_draw()` 等渲染 API 的簽名尚未標準化至 API.ts。目前由 `basic_renderer` 內部管理。

---

## 網格與端口座標定義 (2× Grid & Edge Ports)

為讓連接埠在 3D 空間中可以 **1:1 完美重合匹配**，採用雙倍解析度網格：

*   **格子中心 (Position)**：固定為 **全偶數** 座標 `(2i, 2j, 2k)`。
    例如 `(0,0,0)`、`(2,0,0)`、`(0,2,0)`。

*   **連接埠 (Port)**：位在相鄰格子的交界面上，座標必為 **恰好 1 個奇數，其餘 2 個偶數**。
    例如 X 軸方向的 Port：`(1, 0, 0)`、`(-1, 0, 0)`。

```text
  (-2,0)         (0,0)          (2,0)          (4,0)  ← 設備中心（偶數）
    |              |              |              |
 ───┼──────(-1,0)──┼──────(1,0)───┼──────(3,0)───┼─── ← 邊界 Port（奇數）
```

**連通判斷**：

*   `(0,0,0)` 設備的右側 Output Port = `(1, 0, 0)`
*   `(2,0,0)` 設備的左側 Input Port = `(2-1, 0, 0)` = `(1, 0, 0)`
*   → 兩個 Port 的世界座標完全相同，只需比對 `portA.world_pos === portB.world_pos` 即可判斷連通。

---

## 待定事項 (Unknown / TBD)

| 項目 | 狀態 | 備註 |
|------|------|------|
| Vue 與 Canvas 的整合方式 | ⚠️ unknown | Vue 如何掛載 Canvas、資料響應邏輯未確定 |
| 全域狀態管理 | ⚠️ unknown | 是否引入 Pinia 或維持純 TS 響應式 |
| Pack 間通訊機制 | ⚠️ unknown | 跨 pack 是否需要 Event Bus 或 Shared Store |
| 渲染 API 標準化 | ⚠️ unknown | `register_device_draw()` 等是否移入 API.ts |
| UI 架構 | ⚠️ unknown | Vue component 與遊戲狀態的邊界未定 |
