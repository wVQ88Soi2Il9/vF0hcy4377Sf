# 專案規範與框架原則 (Project Conventions)

基於「本體只是畫布、一切皆為 Mod」的核心哲學，本專案的框架規範如下：

---

## 1. 程式碼風格 (Code Style)

*   **大括號風格**：強制使用 Allman style（`{` 獨佔新行），適用於 function, interface, class, for, switch 等。
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
    *   屬性 / 變數：`position`, `input_ports`, `output_ports`, `other_info`
    *   函式：`rotate_vector()`, `place_device()`

---

## 2. 框架角色定位 (無 Vue 純 TypeScript 架構)

*   本專案採用純粹的 TypeScript + HTML5 Canvas 架構，**完全捨棄 Vue** 等前端框架。
*   **核心狀態**：Core (`src/core/`) 純 TS，零依賴。
*   **畫布渲染**：自研 Canvas 渲染器，負責所有的地圖與節點渲染。
*   **使用者介面 (UI)**：使用純原生的 TypeScript 與 DOM 操作來實作覆蓋層 UI，不依賴任何第三方框架。

---

## 3. 狀態與 Mod 擴充

*   **單一事實來源**：整個世界地圖狀態即為 `game_map` 物件。
*   **Mod 資料擴充**：`device` 中預留 `other_info: Record<string, unknown>` 欄位供 Mod 使用，核心絕對不讀取此欄位內的邏輯。
*   **最小化驗證**：避免為微小變更頻繁執行編譯檢查，依賴 TypeScript 靜態型別提示為主。

