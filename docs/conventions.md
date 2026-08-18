# 專案規範 (Project Conventions)

    > **設計哲學**：本體很小，只有引擎核心(畫布 + Hook 系統)。其他一切皆為 Mod。

---

## 1. 程式碼風格 (Code Style)

### 大括號風格
強制使用 **Allman style**(`{` 獨佔新行)，無例外。

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

### 語言符號規範
**一律**使用半形符號,().
而非全形的，（）。
---

## 2. 技術棧 (Tech Stack)

| 層 | 技術 | 狀態 |
|----|------|------|
| 建構工具 | Vite + TypeScript | ✅ 確定 |
| 框架 | Vue 3 | ✅ 已安裝 |
| 樣式 | Tailwind CSS v4 | ✅ 已安裝 |
| 畫布渲染 | HTML5 Canvas(2D) | ✅ 確定 |
| UI 架構 | 純 DOM / Vanilla Web API（由 packs/basic_ui 管理 Viewport 與 UI 面板） | ✅ 確定 |
| 狀態管理 | **unknown** - 是否使用 Pinia 或純 TS reactive 未定 | ⚠️ 待定 |

> ⚠️ 標記 **unknown** 的部分：**禁止寫死任何假設**，需等待規範確定後再實作。

---

## 3. 目錄結構 (Source Layout)

```
src/
├── API.ts              # 引擎公開事件契約(pack 的訂閱入口)
├── runtime.ts          # 啟動期全域狀態(map / registry)
├── main.ts             # 應用程式啟動點
├── core/               # 引擎核心，零具體遊戲邏輯，零外部依賴
│   ├── types.ts        # 全域型別定義(game_map, device, port...)
│   ├── hooks.ts        # Hook 系統(on_device_create, on_build_graph...)
│   ├── map_manager.ts  # 地圖狀態 CRUD
│   ├── pack_manager.ts # Pack 載入與生命週期管理
│   └── index.ts        # 核心 re-export
├── utils/              # 純數學/座標輔助函數，無副作用
│   ├── math.ts
│   ├── spatial_map.ts
│   └── device_utils.ts
└── packs/              # 所有遊戲邏輯、渲染、UI 均在此
    ├── loader.ts       # 掃描 & 載入所有 pack 的 init_pack()
    ├── basic_renderer/ # 內建基礎渲染 pack (僅負責 Canvas 建立與繪製，不直接掛載至 DOM)
    ├── basic_ui/       # 內建基礎 UI pack (負責 Viewport 容器掛載、Info Bar 與 CMD Bar)
    │   ├── index.ts
    │   ├── layout.ts
    │   ├── info_bar.ts
    │   ├── cmd_bar.ts
    │   └── cmd_executor.ts
    ├── cmd_tool/       # 內建 CMD 指令與字串解析 pack
    └── vanilla/        # 內建基礎遊戲邏輯 pack
```

---

## 4. Pack 規範 (Pack Conventions)

### Canvas 與 UI 管理規則
1. `basic_renderer` 僅建立與維護 Canvas 繪製邏輯，不再直接硬編碼掛載至 DOM (`#app`)。
2. `basic_ui` 負責初始化頂層 DOM 結構 (`#ui_root`)，從 `basic_renderer` 取得 Canvas 並嵌入 `#canvas_viewport` 容器中。
3. `basic_ui` 透過 `ResizeObserver` 監聽 Viewport 尺寸變更，同步通知 `basic_renderer` 更新 Canvas 寬高與畫面重繪。

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

若 pack 需要自訂邏輯(碰撞偵測, Graph 建構等)，建立 `index.ts` 並匯出 `init_pack(): void`。  
`loader.ts` 會在啟動時自動掃描並呼叫，**無需**手動在 `main.ts` 引入。  
純資料包(只有 JSON)完全不需要 `index.ts`。

```typescript
// packs/{my_pack}/index.ts
import { register_overlap_check } from '@/API';

export function init_pack(): void
{
    // 只能透過 @/API 提供的函式掛 hook
    register_overlap_check(my_overlap_fn);
}
```

### 三條強制規範

**Rule 1：不要直接操作 `hooks` 物件**  
`core/hooks.ts` 裡的 `hooks` singleton 不允許直接 push/splice。訂閱事件一律用 `@/API` 提供的函式：

```typescript
// ✅ 正確
import { on_device_create } from '@/API';
on_device_create(my_fn);

// ❌ 禁止
import { hooks } from '@/core/hooks';
hooks.on_device_create.push(my_fn);  // 繞過訂閱機制，無法取消訂閱
```

**Rule 2：靜態定義透過 JSON 傳入**  
Device 的靜態定義(`shape`, `ports`)必須放在 `data/devices.json`。  
渲染設定(`draw`)放在 `other_info.basic_renderer` 中，`loader.ts` 自動載入。

```json
{
  "id": "my_device",
  "shape": [[0, 0, 0]],
  "input_ports": [],
  "output_ports": [],
  "other_info": {
    "basic_renderer": {
      "color": "#1e3a5f",
      "border": "#4a90d9",
      "label": "ASM"
    }
  }
}
```

**Rule 3：每個 device 強制要有獨立的 draw function**  
每個 `device_definition` 必須擁有獨立註冊的繪圖函式（即使是色塊繪圖函式）。`basic_renderer` 不會在繪圖迴圈中進行 inline fallback 補齊或隱性假設。

**Rule 4：拒絕隱性/靜態補齊 (No Implicit Zero-Padding)**  
所有向量（如 `device_definition` 的 `shape`, `input_ports`, `output_ports` 與 `device.position`）必須假設為乾淨、完整的資料。禁止在向量運算中進行隱性的 `?? 0` 靜態補齊或模糊猜測。所有資料維度必須與當前運算維度一致。

**Rule 5：Pack 介面採用物件導出 (Object Export)**  
Pack 對外暴露的 API 與介面（例如 `basic_renderer`）必須統一導出一個以 Pack 名稱命名的 API 物件（例如 `export const basic_renderer = { ... }`）。外部模組在存取 Pack 功能時一律使用物件點號語法，維護模組邊界與命名空間。

**Rule 6：Rely-Pack 擴充目錄與單向推送機制 (`$<rely_pack>/`)**  
當 Pack A 需要為所依賴的 Pack B 提供擴充邏輯（如繪圖函式、物理邏輯等）時：
1. 於 Pack A 內部建立 `$<pack_b_name>/` 子目錄（`$` 前綴標記為向特定 Rely Pack 擴充的點）。
2. 被依賴的 Pack B 不知曉任何外部 Pack 的結構（維護嚴格單向依賴）。
3. 由 Pack A 的 `index.ts` 透過 `import.meta.glob('./$<pack_b_name>/*.ts', { eager: true })` 自動動態掃描所有對應模組，並主動註冊至 Pack B。
4. 若 Pack A 同時依賴多個 Pack（如 `basic_renderer` 與 `basic_physics`），則在 Pack A 下建立多個對應的擴充目錄（如 `$basic_renderer/` 與 `$basic_physics/`），並於 Pack A 的 `index.ts` 中分別進行 `import.meta.glob` 掃描推送。

**Rule 7：CMD Position 偶數座標規範 (Even Position Rule)**  
CMD 指令傳入的 `position` 參數（如 `create` / `move`）必須嚴格驗證各維度座標均為偶數 integer（`coord % 2 === 0`）。若輸入奇數座標將回傳錯誤，禁止自動或靜態修補。

**Rule 8：地圖與裝置 UID 規範 (Map UID & Renderer Rule)**  
地圖 `game_map.uid` 從 `1` 開始遞增分配。繪圖函式需在裝置上畫出其唯一 `#UID`，右側 UI 面板與 `info --"<uid>"` 指令可給定 UID 查詢並顯示裝置詳細資訊。

---


## 5. 編譯驗證原則

*   **最小化驗證**：只有大更動才需要執行編譯檢查(`tsc -b`)。
*   小幅修改、純 JSON 資料包不強制驗證。

## 6. 工作原則

*   發現有風險、不明確的指示時，立刻回報給我
*   **不要額外做事**：每次只做要求的部分