# 系統架構設計 (Architecture)

---

## 三層單向架構 (Three-Layer Architecture)

依賴方向：`packs` → `utils` → `core` (**嚴格單向, 禁止反向依賴**)

```
src/
├── core/                   # 層 1：引擎核心
│   ├── types.ts            # 全域型別(game_map, device, port...)
│   ├── hooks.ts            # Hook 擴充點(所有副作用的唯一入口)
│   ├── map_manager.ts      # 地圖狀態 CRUD
│   ├── pack_manager.ts     # Pack 生命週期管理
│   └── index.ts
├── utils/                  # 層 2：純函數工具庫
│   ├── math.ts             # 向量、座標運算
│   ├── spatial_map.ts      # 空間索引
│   └── device_utils.ts     # Device 衍生計算
├── API.ts                  # 引擎公開事件契約(pack 的訂閱入口)
├── runtime.ts              # 啟動期全域狀態(map / registry)
├── main.ts                 # 應用啟動點
└── packs/                  # 層 3：遊戲邏輯 / 渲染 / UI(均為 Mod)
    ├── loader.ts           # 掃描 & 呼叫所有 pack 的 init_pack()
    ├── basic_renderer/     # 內建基礎渲染 pack
    │   ├── index.ts
    │   ├── draw_device.ts
    │   ├── draw_grid.ts
    │   ├── draw_registry.ts
    │   └── types.ts
    ├── basic_ui/           # 內建基礎 UI pack
    │   ├── index.ts
    │   ├── layout.ts
    │   ├── info_bar.ts
    │   ├── cmd_bar.ts
    │   └── cmd_executor.ts
    ├── vanilla/            # 內建基礎遊戲邏輯 pack
    │   ├── index.ts
    │   ├── overlap.ts
    │   └── graph.ts
    └── test/               # 測試用 pack(開發期)
```

---

## 各層職責

### 層 1 - Core(引擎核心)

*   **型別定義**：`game_map`、`device`、`device_port` 等全域型別的唯一來源(Single Source of Truth)。
*   **Hook 系統**：`hooks.ts` 是所有副作用的唯一擴充點。Core 不含任何具體遊戲邏輯。
*   **地圖狀態**：`map_manager.ts` 管理設備的 CRUD，呼叫後觸發對應 Hook。
*   **禁止**：import 任何 pack、直接執行遊戲規則。

### 層 2 - Utils(工具庫)

*   純函數，無副作用，無狀態。
*   可被 core 或 packs 引用。
*   **禁止**：import 任何 pack。

### 層 3 - Packs(插件層)

*   所有遊戲規則、渲染邏輯、UI 均在此層，以 pack 形式存在。
*   可以自由 import `core/`、`utils/` 中的任意模組。
*   **禁止**：直接操作 `hooks` singleton(直接 push/splice)— 一律用 `@/API` 的函式訂閱。
*   跨 pack import 情況未確定；目前允許的特例：`@/packs/basic_renderer/draw_registry`。

---

## API 邊界(`src/API.ts`)

`API.ts` 是引擎的公開事件契約。後續開發者在此手動加入新的訂閱入口。

| 函式 | 用途 |
|------|------|
| `create_device()` | 新增裝置至地圖 |
| `delete_device()` | 刪除裝置 |
| `move_device()` | 移動裝置 |
| `rotate_device()` | 旋轉裝置 |
| `select_recipe()` | 設定/清除裝置選擇之食譜 |
| `on_device_create(cb)` | 訂閱裝置建立事件 |
| `on_device_delete(cb)` | 訂閱裝置刪除事件 |
| `on_device_move(cb)` | 訂閱裝置移動事件 |
| `on_device_rotate(cb)` | 訂閱裝置旋轉事件 |
| `on_device_select_recipe(cb)` | 訂閱裝置食譜變更事件 |
| `on_device_change(cb)` | 訂閱任何裝置生命週期與狀態變動 |
| `register_overlap_check(fn)` | 註冊碰撞/越界檢查 Hook |
| `register_graph_build(fn)` | 註冊連接圖建構 Hook |

---

## 啟動期全域狀態(`src/runtime.ts`)

`runtime.ts` 不是引擎事件 API，而是啟動順序的狀態容器。
`main.ts` 在呼叫 `call_all_pack_inits()` 之前對其寫入，需要地圖狀態的 pack(如 basic_renderer)在 `init_pack()` 內讀取。

| 函式 | 用途 |
|------|------|
| `set_map(map)` | 注冊全局地圖(main.ts 寫入) |
| `get_map()` | 讀取全局地圖(pack 在 init_pack() 內使用) |
| `set_registry(r)` | 注冊 Pack Registry(main.ts 寫入) |
| `get_registry()` | 讀取 Pack Registry(pack 在 init_pack() 內使用) |

---

## 網格與端口座標定義 (2× Grid & Edge Ports)

為讓連接埠在 3D 空間中可以 **1:1 完美重合匹配**，採用雙倍解析度網格：

*   **格子中心 (Position)**：固定為 **全偶數** 座標 `(2i, 2j, 2k)`。
    例如 `(0,0,0)`、`(2,0,0)`、`(0,2,0)`。

*   **連接埠 (Port)**：位在相鄰格子的交界面上，座標必為 **恰好 1 個奇數，其餘 2 個偶數**。
    例如 X 軸方向的 Port：`(1, 0, 0)`、`(-1, 0, 0)`。

```text
  (-2,0)         (0,0)          (2,0)          (4,0)  ← 設備中心(偶數)
    |              |              |              |
 ───┼──────(-1,0)──┼──────(1,0)───┼──────(3,0)───┼─── ← 邊界 Port(奇數)
```

**連通判斷**：

*   `(0,0,0)` 設備的右側 Output Port = `(1, 0, 0)`
*   `(2,0,0)` 設備的左側 Input Port = `(2-1, 0, 0)` = `(1, 0, 0)`
*   → 兩個 Port 的世界座標完全相同，只需比對 `portA.world_pos === portB.world_pos` 即可判斷連通。

---

## 待定事項 (Unknown / TBD)

| 待定項目 | 狀態 | 決策結果 |
|---|---|---|
| UI 架構 | ✅ 確定 | 採用純 DOM / Vanilla Web API（由 `packs/basic_ui` 負責 Viewport 容器與 UI 面板） |
