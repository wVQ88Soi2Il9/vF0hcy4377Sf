# 系統架構說明書 (Architecture Design)

本專案採用 **三層單向架構 (Three-Layer Unidirectional Architecture)** 設計：

```text
┌──────────────────────────────────────────────┐
│  Packs Layer (遊戲邏輯插件 / Mod / 資料定義)  │
│  - packs/vanilla/                            │
│  - packs/test/                               │
│  - packs/basic_ui/                           │
│  - packs/basic_renderer/                     │
│  - packs/layered_2d/                         │
└──────────────────────┬───────────────────────┘
                       │ 依賴 (只能透過 @/API 存取)
                       ▼
┌──────────────────────────────────────────────┐
│  Utils Layer (純數學、演算法、座標輔助計算)    │
│  - math.ts, spatial_map.ts, device_utils.ts  │
└──────────────────────┬───────────────────────┘
                       │ 依賴
                       ▼
┌──────────────────────────────────────────────┐
│  Core Layer (核心引擎：純型別、狀態容器、Hooks)│
│  - types.ts, map_manager.ts, hooks.ts        │
└──────────────────────────────────────────────┘
```

---

## 依賴與存取規範 (Dependency & Boundary Rules)

1. **依賴方向**：`packs` → `utils` → `core` (嚴格單向, 禁止反向依賴)。
2. **Pack 邊界隔離**：所有 Pack **嚴格禁止** 直接 import `@/core/*`。Pack 只能 import `@/API` 與 `@/utils/*`。
3. **Core 零業務邏輯**：Core 僅負責資料容器 (State Holder) 與擴充掛勾 (Hooks System)，不包含任何碰撞、連接圖或特定遊戲規則。

---

## 網格與端口座標定義 (2× Grid & Face Ports)

為讓連接埠在 $N$ 維空間中可以 **1:1 完美重合匹配**，採用雙倍解析度網格：

*   **裝置唯一 ID (`uid`)**：地圖 (`game_map`) 建立時 `uid` 預設從 **`1`** 開始遞增分配。

*   **裝置網格錨點 (Position)**：固定為 **全偶數** 座標 $(2i, 2j, 2k)$（注意：**position 是裝置網格錨點/頂點，不是中心**）。CMD 指令（如 `create` 與 `move`）傳入的 position 強制驗證必須全為偶數座標。
    例如 `(0,0,0)`、`(2,0,0)`、`(0,2,0)`。

*   **裝置形狀 (Shape & Cell Block Size)**：`device_definition.shape` 內的每個單元格相對於 position 為偶數步長偏移（例如 `[0,0,0]`、`[2,0,0]`），在世界座標中實際佔據 **2×2×2 格**：
    $[x, x+2) \times [y, y+2) \times [z, z+2)$。

*   **連接埠 (Port)**：位在相鄰單元格交界面的正中心，座標必為 **恰好 1 個偶數，其餘 $n-1$ 個奇數**：
    $$\text{port} \in \{x \in \mathbb{Z}^n : \text{exactly one coordinate is even and } n-1 \text{ are odd}\}$$
    例如：
    - X 軸方向邊界面 Port：`(2, 1, 1)`、`(0, 1, 1)`（X 為偶數邊界面，Y/Z 為奇數中點）。
    - Y 軸方向邊界面 Port：`(1, 2, 1)`、`(1, 0, 1)`（Y 為偶數邊界面，X/Z 為奇數中點）。
    - Z 軸垂直跨層 Port：`(1, 1, 2)`、`(1, 1, 0)`（Z 為偶數樓板交界面，X/Y 為奇數中點）。

```text
  [0,0] 錨點          [2,0] 錨點          [4,0] 錨點  ← 設備網格錨點(全偶數)
    |                   |                   |
 ───┼──────(2,1)────────┼──────(4,1)────────┼─── ← 邊界 Port(X為偶數邊界面，Y為奇數中點)
    │ (單元區間 [0,2])   │ (單元區間 [2,4])   │
```

**連通判斷**：

*   `[0,0,0]` 設備的右側 Output Port（偏移 `[2,1,1]`）= `[2, 1, 1]`
*   `[2,0,0]` 設備的左側 Input Port（偏移 `[0,1,1]`）= `[2+0, 0+1, 0+1]` = `[2, 1, 1]`
*   → 兩個 Port 的世界座標完全相同，只需比對 `portA.world_pos === portB.world_pos` 即可判斷連通。

---

## 待定事項 (Unknown / TBD)

| 待定項目 | 狀態 | 決策結果 |
|---|---|---|
| UI 架構 | ✅ 確定 | 採用純 DOM / Vanilla Web API（由 `packs/basic_ui` 負責 Viewport 容器與 UI 面板） |
