# 專案規範與框架原則 (Project Conventions)

本體很小，只有畫布，其他東西都視為mod

---

## 1. 程式碼風格 (Code Style)

*   **大括號風格**：強制使用 Allman style（`{` 獨佔新行），適用全部。
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
*   **命名規範**：全部使用全小寫 `snake_case`

---

## 2. 框架角色定位

*   本專案暫時採用 TypeScript + HTML5 Canvas 架構。
*   **核心狀態**：Core (`src/core/`) 純 TS，零依賴。
*   **畫布渲染**：unknown。
*   **UI**：unknown。

---

## 3. 狀態與 Mod 擴充 (Everything is a Plugin)

*   **最小化驗證**：只有大更動需要編譯檢查。