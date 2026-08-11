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

---

## 4. Pack 規範 (Pack Conventions)

### 標準目錄結構

```
packs/
└── {pack_name}/
    ├── data/
    │   ├── devices.json     # optional
    │   ├── items.json       # optional
    │   └── recipes.json     # optional
    └── index.ts             # 選用，若需掛載 hook 則必須匯出 init_pack(): void
```

### `index.ts` 的契約 (若有自訂邏輯)

若你的 pack 需要自訂邏輯 (例如客製化碰撞偵測或 graph 建構)，你可以建立 `index.ts` 並匯出 `init_pack(): void`。
`loader.ts` 會在啟動時自動掃描並呼叫，無需手動在 `main.ts` 引入。若只有純資料 (items, recipes) 或是基本的 device，則完全不需要 `index.ts`。

```typescript
// packs/{my_pack}/index.ts

import { register_overlap_check } from '@/API'

export function init_pack(): void
{
    // 透過 API 掛 hook（禁止直接操作 @/core/hooks）
    register_overlap_check(my_overlap_fn)
}
```

### 三條強制規範

1. **不准動到 `core/`** — pack 禁止直接 import `@/core/hooks` 並手動操作。一律透過 `@/API` 提供的函式（`register_overlap_check`、`register_graph_build`、`on_device_create` 等）。

2. **資料與渲染設定透過 JSON 傳入** — device 的靜態定義（shape、ports）必須放在 `data/devices.json`。
   *渲染設定* (draw) 應放在 `other_info.draw` 中。`loader.ts` 會自動載入，核心 (core) 不會去讀取，但 `basic_renderer` 繪製時會使用這些設定。

   ```json
   {
     "id": "my_device",
     "shape": [[0,0,0]],
     "input_ports": [],
     "output_ports": [],
     "recipe_ids": [],
     "other_info": {
       "draw": {
         "color": "#1e3a5f",
         "border": "#4a90d9",
         "label": "ASM"
       }
     }
   }
   ```

3. **每個 device 必須設定渲染外觀** — 除非你在 `index.ts` 透過 `register_device_draw()` 註冊了客製化的繪製函式，否則所有的 device 都必須在 JSON 的 `other_info.draw` 中設定 `color`, `border`, `label`。未設定的 device 會以紅色 fallback 顯示。