# 專案規範與框架原則 (Project Conventions)

基於「本體只是畫布、一切皆為 Mod」的核心哲學，本專案的框架規範如下：

---

## 1. 程式碼風格 (Code Style)

*   **大括號風格**：強制使用 Allman style（`{` 獨佔新行），適用全部 function, interface, class, for, switch 等。
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

## 2. 框架角色定位

*   本專案暫時採用純粹的 TypeScript + HTML5 Canvas 架構。
*   **核心狀態**：Core (`src/core/`) 純 TS，零依賴。
*   **畫布渲染**：unknown。
*   **UI**：unknown。

---

## 3. 狀態與 Mod 擴充 (Everything is a Plugin)

*   **單一事實來源**：整個世界地圖狀態即為 `game_map` 物件。
*   **資料層面擴充**：`device` 中預留 `other_info: Record<string, unknown>` 欄位供 Mod 使用，核心絕對不讀取此欄位內的資料。
*   **邏輯層面擴充 (Hooks)**：所有的遊戲具體規則（如重疊檢測 `check_map_overlap`、電路圖構建 `build_device_graph`）皆非寫死在 Core 中，而是由 `packs/` 透過註冊至 `core/hooks.ts` 中執行。Vanilla 玩法本身也只是一個 Mod。
*   **最小化驗證**：只有大更動需要編譯檢查。
