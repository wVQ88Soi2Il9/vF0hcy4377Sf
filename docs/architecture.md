# 系統架構設計 (Architecture)

## 三層單向架構 (Architecture Layers)

```text
src/
├── core/         # 純 TS 型別定義與地圖核心抽象邏輯
├── utils/        # 衍生的純數學與座標計算輔助函數
├── renderer/     # (待開發) Canvas 2D 畫布渲染器
├── ui/           # (待開發) 原生 TS / DOM UI 覆蓋層
└── packs/        # Mod 與內建資料包
```

*   **Core (第一層)**：純 TS 型別定義（`vector`, `rotation`, `device`, `game_map`, `item`, `recipe`），無外部依賴。
*   **Renderer (第二層)**：讀取地圖資料並使用原生的 HTML5 Canvas API 進行畫面繪製。
*   **UI (第三層)**：使用原生的 HTML/TypeScript 控制選單與操作面板。

---

## 座標系設計

### 基本座標
```text
z = layer index（離散整數）
x, y = 層內格座標

world cell = vector { x, y, z }
```
Device 的 cells 是 `vector[]`，自然支援跨層，不需要任何額外包裝。

### 網格與端口座標定義 (2x2 Grid & Edge Ports)

為了讓連接埠在 3D 空間中可以 **1:1 完美重合匹配**，我們採用雙倍解析度網格 (Half-grid / Boundary coordinates)：

*   **格子中心/點 (Position)**：固定為 **全部偶數** 座標 `(2i, 2j, 2k)`，代表格子的中心。例如 `(0,0,0)`, `(2,0,0)`, `(0,2,0)`。
*   **連接埠 (Port)**：固定位在相鄰格子的交界面 (Faces) 上，因此座標必須為 **剛好 1 個奇數，其餘 2 個為偶數**。
    *   例如沿 X 軸相接的 Port，X 為奇數，Y, Z 為偶數，如 `(1, 0, 0)` 或 `(-1, 0, 0)`。

圖解範例：
```text
  (-2,0)         (0,0)          (2,0)          (4,0)  ← 設備中心 (偶數)
    |              |              |              |
 ───┼──────(-1,0)──┼──────(1,0)───┼──────(3,0)───┼─── ← 邊界 Port (奇數)
```

**邊界相交優勢：**
*   位在 `(0,0,0)` 的設備，其右側 Output Port 座標為 `(1, 0, 0)`。
*   放置在 `(2,0,0)` 的相鄰設備，其左側 Input Port 座標同樣為 `(2 - 1, 0, 0) = (1, 0, 0)`。
*   **兩個 Port 的世界座標會完全相同！** 要判斷兩台設備是否連通，只需要檢查 `portA.world_pos === portB.world_pos` 即可。
