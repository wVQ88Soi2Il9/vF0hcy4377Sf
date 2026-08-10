# Factory Engine (working title)

一個以 **TypeScript** 撰寫的 3D 網格工廠模擬引擎。
核心本體極簡，只提供地圖狀態與擴充點（畫布），其餘所有遊戲邏輯（碰撞檢測、節點連接圖、配方系統……）皆以 **Mod / Pack** 的形式外掛進來。

## 特色

- 🧱 **三層單向架構**：`core` → `utils` → `packs`，核心零依賴、純型別 + 狀態容器。
- 🔌 **Hooks 擴充系統**：`on_check_overlap`、`on_build_graph` 等掛勾，讓 Pack 以外掛方式注入邏輯，核心不寫死任何遊戲規則。
- 📦 **資料驅動**：裝置、物品、配方皆由 Pack 內的 JSON 定義，並自動以資料夾名稱作為 namespace 前綴，避免 ID 衝突，支援熱插拔（`load_pack` / `unload_pack`）。
- 📐 **半格解析度座標系統**：格子中心固定為偶數座標、連接埠固定為奇數座標，讓相鄰裝置的埠可用世界座標 `===` 直接比對是否連通，無需額外的鄰接判斷邏輯。

## 專案結構

```text
src/
├── core/                 # 純 TS 型別定義、地圖狀態與 Hooks 擴充點
│   ├── types.ts          # vector / rotation / pack / device / game_map ...
│   ├── map_manager.ts    # create / delete / move / rotate device
│   ├── pack_manager.ts   # pack registry：載入、卸載、查詢定義
│   └── hooks.ts          # on_check_overlap / on_build_graph 掛勾與觸發器
│
├── utils/                # 衍生的純數學與座標計算輔助函數
│   ├── math.ts           # 向量加法、3D 旋轉、座標序列化
│   ├── device_utils.ts   # 取得裝置世界座標格子 / 埠位置
│   └── spatial_map.ts    # 以座標為 key 的通用空間查找表
│
└── packs/                # 遊戲邏輯插件與 Mod 資料包 (Plugins & Mods)
    ├── loader.ts         # 自動掃描 packs/*/data/*.json 並載入為 pack
    └── vanilla/          # 基本包
        ├── index.ts      # 註冊 vanilla 的邏輯至 core hooks
        ├── overlap.ts    # 出界 / 重疊檢測
        ├── graph.ts      # 依據埠座標比對，建立裝置間的有向連接圖
        ├── renderer/     # (待開發)
        └── ui/           # (待開發)
```

## 核心概念

### Core 引擎核心

只負責：

- **狀態載體**：`game_map`、`device`、`device_definition`、`pack` 等純型別與地圖操作函式。
- **擴充點（Hooks）**：`hooks.on_check_overlap`、`hooks.on_build_graph`，任何 Pack 都能 `push` 自己的邏輯進去，並透過 `trigger_check_overlap` / `trigger_build_graph` 統一觸發、合併結果。

Core 完全不包含具體遊戲規則，也不讀取 `device.other_info` — 該欄位保留給 Mod 自由擴充動態資料（如庫存、運作狀態、進度）。

### Packs 插件層

每個 Pack 是一個資料夾（如 `packs/vanilla`），內含：

- `data/*.json`：靜態定義（items / recipes / devices），由 `loader.ts` 自動掃描並以資料夾名稱為 namespace 加上前綴（例如 `vanilla:belt`）。
- `index.ts` + 邏輯檔案：動態邏輯，透過 `hooks` 註冊進 core。

以 `vanilla` 為例：

- `overlap.ts`：掃描地圖上所有裝置，回報出界（`out_of_bounds`）與重疊（`overlapped`）的 `unique_id`。
- `graph.ts`：依裝置輸出埠與輸入埠的世界座標是否完全重合，建立裝置之間的有向連接圖（`device_node[]`）。

### 網格與端口座標定義（Grid & Edge Ports）

採用雙倍解析度網格，讓連接埠能 1:1 完美重合匹配：

- **格子中心（Position）**：固定為全部偶數座標 `(2i, 2j, 2k)`。
- **連接埠（Port）**：固定位在相鄰格子交界面上，座標必須恰有 1 軸為奇數、其餘為偶數。

```text
  (-2,0)         (0,0)          (2,0)          (4,0)  ← 設備中心（偶數）
    |              |              |              |
 ───┼──────(-1,0)──┼──────(1,0)───┼──────(3,0)───┼─── ← 邊界 Port（奇數）
```

因此，判斷兩台裝置是否連通，只需比較兩者的埠世界座標是否相等即可，詳見 `docs/architecture.md`。

## 開發規範

- 大括號一律獨立成行（Allman style）。
- 命名一律使用全小寫 `snake_case`（包含型別、函式、介面）。

## 目前進度

| 模組                     | 狀態      |
| ------------------------ | --------- |
| Core（型別 / 地圖 / Hooks） | ✅ 已完成 |
| Vanilla Pack — 重疊檢測    | ✅ 已完成 |
| Vanilla Pack — 連接圖建構  | ✅ 已完成 |
| Pack Loader（自動掃描 JSON）| ✅ 已完成 |
| 畫布渲染（Renderer）        | 🚧 待開發 |
| UI                        | 🚧 待開發 |

## 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```