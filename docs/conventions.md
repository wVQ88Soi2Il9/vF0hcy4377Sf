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
    │   ├── devices.json     # 必要，device 定義（shape、ports、recipe_ids）
    │   ├── items.json       # 選用
    │   └── recipes.json     # 選用
    └── index.ts             # 必要，必須 export init_pack(): void
```

### `index.ts` 的契約

每個 pack 的 `index.ts` **必須** export 一個 `init_pack(): void` 函式。
`loader.ts` 會在啟動時自動掃描並呼叫，無需手動在 `main.ts` 引入。

```typescript
// packs/{my_pack}/index.ts

import { register_overlap_check } from '@/API'
import { register_device_draw }   from '@/packs/basic_renderer/draw_registry'

export function init_pack(): void
{
    // 透過 API 掛 hook（禁止直接操作 @/core/hooks）
    register_overlap_check(my_overlap_fn)

    // 每個 device 都必須有對應的 draw function
    register_device_draw('my_pack:my_device', (ctx, sx, sy, sw, sh, zoom) =>
    {
        ctx.fillStyle = '#4a90d9'
        ctx.fillRect(sx, sy, sw, sh)
    })
}
```

### 三條強制規範

1. **不准動到 `core/`** — pack 禁止直接 import `@/core/hooks` 並手動操作。一律透過 `@/API` 提供的函式（`register_overlap_check`、`register_graph_build`、`on_device_create` 等）。

2. **資料透過 JSON 傳入** — device 的靜態定義（shape、ports）必須放在 `data/devices.json`，格式遵循 `device_definition` 型別，由 `loader.ts` 自動載入，不可在 TS 程式碼中硬編碼。

3. **每個 device 必須有 draw** — `init_pack()` 必須為 `data/devices.json` 中定義的每一個 device 呼叫 `register_device_draw()`。未註冊的 device 會以紅色 fallback 顯示，視為未完成。