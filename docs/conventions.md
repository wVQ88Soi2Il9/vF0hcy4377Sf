# 專案規範與框架原則 (Project Conventions)

基於我們先前確立的「本體只是畫布、一切皆為 Mod」以及「Core 為純 TypeScript」的核心哲學，這個專案（vF0hcy4377Sf）的框架規範非常明確。

我們的目標是**極致的解耦 (Decoupling)** 與**高效能**，為未來的 3D 擴展與 Mod 系統鋪路。

---

## 1. 框架角色定位 (Vue.js 的職責)

在這個專案中，**Vue 3 不是主角，而是配角。**

*   **❌ Vue 不負責：**
    *   **核心邏輯**：不能把遊戲邏輯寫在 Vue component 裡面（例如 `methods` 或 `watch` 裡算座標）。
    *   **畫布渲染**：我們不使用 Vue component 來渲染地圖上的 Device（也就是為什麼我們捨棄了 VueFlow）。DOM 節點過多會導致效能崩潰。
    *   **核心狀態管理**：Core (`src/core/`) 完全不知道 Vue 的 `ref` 或 `reactive` 是什麼。
*   **✅ Vue 只負責：**
    *   **UI 覆蓋層 (Overlay UI)**：右鍵選單、設定面板、Mod 的操作介面、配方選擇器。
    *   **使用者輸入綁定**：將滑鼠/鍵盤事件轉發給 Renderer 或 Core 控制器。

---

## 2. 三層架構規範 (Architecture Layers)

專案必須嚴格遵守以下三層架構，**依賴方向只能單向向下**：

### 第一層：Core (純 TypeScript)
*   **目錄**：`src/core/`
*   **規範**：
    *   **零依賴**：不允許 import 任何第三方庫（包含 Vue）。
    *   **純函式 (Pure Functions)**：給定相同的輸入，必定產生相同的輸出。不依賴外部狀態。
    *   **無副作用**：所有改變狀態的函式，都必須顯式地傳入狀態物件（例如 `placeDevice(map, device)`）。
    *   **資料結構**：只定義靜態的介面 (`interface`) 與型別 (`type`)。

### 第二層：Renderer (渲染層)
*   **目錄**：`src/renderer/`
*   **規範**：
    *   負責讀取 Core 的 `GameMap` 資料，並繪製到 `<canvas>` 上。
    *   目前使用 2D Canvas API，未來可無縫抽換為 Three.js (WebGL)。
    *   **獨立運作**：Renderer 只需要一個 Canvas element 和 GameMap data 就能運作，不需要依賴 Vue。

### 第三層：App / UI (Vue 層)
*   **目錄**：`src/ui/`, `src/App.vue`
*   **規範**：
    *   這是唯一允許使用 `.vue` 檔案和 Vue API (`ref`, `reactive`, `watch`) 的地方。
    *   **狀態橋接**：在最頂層（例如 `App.vue` 或一個簡單的 store）持有 `GameMap` 的實例。可以將其包裹為 `shallowRef` 或 `reactive`，以便當地圖更新時，UI（如屬性面板）能自動更新。
    *   但不建議用 Vue 去深度監聽 (deep watch) 整個 `GameMap` 來驅動高頻率的渲染。

---

## 3. 狀態與資料流規範

*   **單一事實來源 (Single Source of Truth)**：整個世界的狀態就是一個 `GameMap` 物件。
*   **修改資料**：
    *   UI 或使用者操作，呼叫一個「Action / Controller」。
    *   Controller 呼叫 `src/core/map.ts` 的純函式來修改 `GameMap`。
    *   修改完成後，通知 Renderer 重繪 (RequestAnimationFrame)。
*   **Mod 的資料**：
    *   Core 裡面預留了 `otherinfo: Record<string, unknown>` 給 Mod 使用。Core 不解析它，只負責儲存和傳遞。

---

## 4. 目錄結構公約

接下來的開發，我們將遵循這個結構來清理和建立檔案：

```text
src/
├── core/         # (已完成) 純 TS，零依賴的核心邏輯
├── renderer/     # (待開發) 畫布渲染邏輯 (Canvas 2D)
├── ui/           # (待開發) Vue UI 元件 (選單、面板)
├── mods/         # (未來) 官方或第三方功能模組
├── App.vue       # 應用的根節點，組合 Renderer 和 UI
└── main.ts       # 入口點
```

---

## 總結

這個規範的核心精神是：**如果明天你想把這個專案從 Vue 換成 React，或者從 2D Canvas 換成 3D Three.js，你的 `src/core/` 甚至大部分的架構都不需要改動任何一行程式碼。**
