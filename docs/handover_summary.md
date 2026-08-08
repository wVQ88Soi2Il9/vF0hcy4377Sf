# 專案交接與討論總結 (Handover Summary)

本文件供後續所有 AI Agent / 新對話視窗閱讀，以便迅速掌握專案哲學、架構決定與當前進度。

---

## 1. 核心哲學 (Core Philosophy)
*   **本體只有畫布**：本體極小化，只負責維護地圖與裝置狀態，其餘所有 UI、工具列、連線、模擬運算皆為 Mod 附加。
*   **拋棄 VueFlow**：因為需要離散整數格座標（Grid Coordinates）與自然跨層（3D / Layer），地圖渲染不使用 DOM / VueFlow，改用自研 Canvas 渲染器（Renderer）。

---

## 2. 程式碼規範 (Strict Rules)
1.  **Allman 括號風格**：所有 `function`, `interface`, `class`, `switch`, `for` 等，開頭大括號 `{` 必須獨立換行。
2.  **全小寫 `snake_case` (`a_b_c`)**：檔名、型別/介面、函式名、變數名、物件屬性名一律使用全小寫 `snake_case`。
3.  **Core 零依賴**：`src/core/` 必須維持純 TypeScript，不引入 Vue、Pinia 或 DOM API。

---

## 3. 三層架構 (Three-Layer Architecture)
*   **Core (第一層)** (`src/core/`)：純 TS 型別定義（`vector`, `rotation`, `device`, `game_map`, `item`, `recipe`）。
*   **Renderer (第二層)** (`src/renderer/`)：使用 Canvas 2D 讀取 `game_map` 並渲染，不依賴 Vue（未來可無縫更換為 WebGL/Three.js）。
*   **UI (第三層)** (`src/ui/`)：Vue 3 僅用於 UI 覆蓋層（選單、工具列、屬性面板）。

---

## 4. 當前開發進度 (Status)
- [x] 確定 Core 架構與三層設計
- [x] 完成 `src/core/types.ts` 純型別定義
- [x] 建立 `AGENTS.md` 自動約束規則
- [ ] **待進行**：實作 `src/renderer/`（Canvas 2D 畫布與相機 Pan/Zoom 控制）
- [ ] **待進行**：實作 `src/ui/`（Vue 右鍵選單與動作觸發器）
