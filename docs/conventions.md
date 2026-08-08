# 專案規範與框架原則 (Project Conventions)

基於「本體只是畫布、一切皆為 Mod」以及「Core 為純 TypeScript」的核心哲學，本專案的框架規範如下：

---

## 1. 程式碼風格 (Code Style)

*   **大括號風格**：強制使用 Allman style（`{` 獨佔新行）。
    ```typescript
    function my_function()
    {
        // ...
    }

    interface my_interface
    {
        // ...
    }
    ```
*   **命名規範**：全部使用全小寫 `snake_case` (`a_b_c`)。
    *   檔名：`types.ts`, `my_file.ts`
    *   型別 / 介面：`vector`, `rotation`, `device`, `game_map`, `item`, `recipe`
    *   屬性 / 變數：`start_point`, `input_ports`, `output_ports`, `other_info`
    *   函式：`rotate_vector()`, `place_device()`

---

## 2. 框架角色定位 (Vue.js 的職責)

*   **❌ Vue 不負責：**
    *   **核心邏輯**：不把遊戲/地圖邏輯寫在 Vue 元件中。
    *   **畫布渲染**：不用 Vue DOM 元件渲染地圖節點（捨棄 VueFlow）。
    *   **核心狀態**：Core (`src/core/`) 純 TS，零依賴。
*   **✅ Vue 只負責：**
    *   **UI 覆蓋層 (Overlay UI)**：右鍵選單、設定面板、Mod 操作介面。
    *   **使用者輸入轉發**：將滑鼠/鍵盤事件轉發給 Renderer 或控制器。

---

## 3. 三層單向架構 (Architecture Layers)

```text
src/
├── core/         # 純 TS 型別定義與地圖核心 CRUD 邏輯 (Mutable)
├── utils/        # 衍生的純數學與座標計算輔助函數
├── renderer/     # (待開發) Canvas 2D 畫布渲染器（未來可換 Three.js）
├── ui/           # (待開發) Vue UI 覆蓋層
└── mods/         # (未來) Mod 外掛模組
```

*   **Core (第一層)**：只有 `src/core/types.ts` 純型別定義，無邏輯、無副作用。
*   **Renderer (第二層)**：讀取地圖資料並繪製 Canvas，不依賴 Vue。
*   **UI (第三層)**：用 Vue 呈現外圍選單與操作面板。

---

## 4. 狀態與 Mod 擴充

*   **單一事實來源**：整個世界地圖狀態即為 `game_map` 物件。
*   **Mod 資料擴充**：`device` 中預留 `other_info: Record<string, unknown>` 欄位供 Mod 使用。

---

## 5. 網格與端口座標定義 (2x2 Grid & Edge Ports)

為了讓連接埠在 3D 空間中可以 **1:1 完美重合匹配**，我們採用雙倍解析度網格 (Half-grid / Boundary coordinates)：

*   **格子中心/點 (Position)**：固定為偶數座標 `(2i, 2j, 2k)`。例如 `(0,0,0)`, `(2,0,0)`, `(0,2,0)`。
*   **連接埠 (Port)**：固定位在格子交界邊界處，帶有奇數座標。例如 `(2i + 1, 2j, 2k)`。

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
