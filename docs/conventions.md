# 專案規範 (Project Conventions)

> **設計哲學**：本體很小，只有引擎核心（畫布 + Hook 系統）。其他一切皆為 Mod。

---

## 1. 程式碼風格 (Code Style)

### 大括號風格
強制使用 **Allman style**（`{` 獨佔新行），適用所有情境。

```typescript
function my_function()
{
    // ...
}

interface my_interface
{
    // ...
}

class my_class
{
    method()
    {
        if (condition)
        {
            // ...
        }
    }
}
```

### 命名規範
**全部使用全小寫 `snake_case`**，無例外。

| 類型 | 範例 |
|------|------|
| 變數、函數 | `device_count`, `get_map_state()` |
| 型別、介面 | `game_map`, `device_port` |
| 檔案、目錄 | `map_manager.ts`, `basic_renderer/` |
| JSON key | `"input_ports"`, `"recipe_ids"` |

### 分號規範
**所有陳述句結尾強制加上分號 `;`**，無例外。

---

## 2. 技術棧 (Tech Stack)

| 層 | 技術 | 狀態 |
|----|------|------|
| 建構工具 | Vite + TypeScript | ✅ 確定 |
| 框架 | Vue 3 | ✅ 已安裝 |
| 樣式 | Tailwind CSS v4 | ✅ 已安裝 |
| 畫布渲染 | HTML5 Canvas（2D） | ✅ 確定 |
| UI 架構 | **unknown** — 尚未確定 Vue 如何整合 Canvas | ⚠️ 待定 |
| 狀態管理 | **unknown** — 是否使用 Pinia 或純 TS reactive 未定 | ⚠️ 待定 |

> ⚠️ 標記 **unknown** 的部分：**禁止寫死任何假設**，需等待規範確定後再實作。

---

## 3. 目錄結構 (Source Layout)

```
src/
├── API.ts              # 引擎公開事件契約（pack 的訂閱入口）
├── runtime.ts          # 啟動期全域狀態（map / registry）
├── main.ts             # 應用程式啟動點
├── core/               # 引擎核心，零具體遊戲邏輯，零外部依賴
│   ├── types.ts        # 全域型別定義（game_map, device, port…）
│   ├── hooks.ts        # Hook 系統（on_device_create, on_build_graph…）
│   ├── map_manager.ts  # 地圖狀態 CRUD
│   ├── pack_manager.ts # Pack 載入與生命週期管理
│   └── index.ts        # 核心 re-export
├── utils/              # 純數學/座標輔助函數，無副作用
│   ├── math.ts
│   ├── spatial_map.ts
│   └── device_utils.ts
└── packs/              # 所有遊戲邏輯、渲染、UI 均在此
    ├── loader.ts       # 掃描 & 載入所有 pack 的 init_pack()
    ├── basic_renderer/ # 內建基礎渲染 pack
    └── vanilla/        # 內建基礎遊戲邏輯 pack
```

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
    └── index.ts             # optional — 有自訂邏輯才建立，必須匯出 init_pack(): void
```

### `index.ts` 契約

若 pack 需要自訂邏輯（碰撞偵測、Graph 建構等），建立 `index.ts` 並匯出 `init_pack(): void`。  
`loader.ts` 會在啟動時自動掃描並呼叫，**無需**手動在 `main.ts` 引入。  
純資料包（只有 JSON）完全不需要 `index.ts`。

```typescript
// packs/{my_pack}/index.ts
import { register_overlap_check } from '@/API'

export function init_pack(): void
{
    // 只能透過 @/API 提供的函式掛 hook
    register_overlap_check(my_overlap_fn)
}
```

### 三條強制規範

**Rule 1：不要直接操作 `hooks` 物件**  
`core/hooks.ts` 裡的 `hooks` singleton 不允許直接 push/splice。訂閱事件一律用 `@/API` 提供的函式：

```typescript
// ✅ 正確
 import { on_device_create } from '@/API'
 on_device_create(my_fn)

// ❌ 禁止
import { hooks } from '@/core/hooks'
hooks.on_device_create.push(my_fn)  // 繞過訂閱機制，無法取消訂閱
```

**Rule 2：靜態定義透過 JSON 傳入**  
Device 的靜態定義（`shape`、`ports`）必須放在 `data/devices.json`。  
渲染設定（`draw`）放在 `other_info.basic_renderer` 中，`loader.ts` 自動載入。

```json
{
  "id": "my_device",
  "shape": [[0, 0, 0]],
  "input_ports": [],
  "output_ports": [],
  "recipe_ids": [],
  "other_info": {
    "basic_renderer": {
      "color": "#1e3a5f",
      "border": "#4a90d9",
      "label": "ASM"
    }
  }
}
```

**Rule 3：每個 device 必須有渲染外觀**  
除非在 `index.ts` 透過 `register_device_draw()` 註冊了客製化繪製函式，否則所有 device 都必須在 JSON 的 `other_info.basic_renderer` 中設定 `color`、`border`、`label`。未設定者以紅色 fallback 顯示。

---

## 5. 編譯驗證原則

*   **最小化驗證**：只有大更動才需要執行編譯檢查（`tsc -b`）。
*   小幅修改、純 JSON 資料包不強制驗證。