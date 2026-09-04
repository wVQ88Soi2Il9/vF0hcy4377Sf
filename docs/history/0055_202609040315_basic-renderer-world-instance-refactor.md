# 0055_202609040315_basic-renderer-world-instance-refactor

- **status:** in-progress
- **prev:** ./0054_202609020154_core-v3-hook-system-refactor.md
- **skill:** plan-history v3

## 主題簡述

落實 basic_renderer 實例化與多世界解耦重構（移除全域狀態、Camera 實例化、Renderer 對接 target_world）。

---

## 觀察與推論

### O1 · 2026-09-04 03:13:43+08:00 — 實例化與世界邊界定案
basic_renderer 全面淘汰全域單例（Singleton），將 camera 與 renderer 封裝為可獨立實例化的物件。Renderer 明確相依於 target_world: world.pure_world，空間幾何與維度一律自 target_world.space 獲取，徹底消除 get_map / get_space 全域查詢；重繪機制全面改由 target_world 的標準事件 Hooks 驅動。

### O2 · 2026-09-04 03:14:40+08:00 — 完成 camera 與 camera_control 實例化重構
在 `camera.ts` 實作 `class camera`，封裝獨立的 pan/zoom/plane 狀態與事件監聽器；`camera_control.ts` 控制函式全面改為操作相機實例，徹底移除 `get_map` 全域查詢。

### O3 · 2026-09-04 03:14:57+08:00 — 完成 class basic_renderer 實例化與世界 Hooks 對接
在 `renderer.ts` 實作 `class basic_renderer`，建構時明確接收 `target_world: world.pure_world`；透過 `target_world.inject_hook` 綁定 `device_change` 與 `history_change`，相機異動時同時通知世界廣播 `camera_change`。

### O4 · 2026-09-04 03:15:24+08:00 — 完成 commands.ts 與 index.ts 解耦
`commands.ts` 提供純視口方程式解析與應用函式 `apply_camera_equation`；`camera_command` 滿足 `reversible_operation_factory` 簽名，且不產生多餘的 Undo Tree 空間歷史節點。

### O5 · 2026-09-04 03:16:00+08:00 — 整合測試 tests/basic_renderer.test.ts 驗證通過
撰寫並通過 5 項單元測試，驗證多個 Camera / Renderer 實例在多世界環境下的完全隔離性、世界 Hooks 驅動重繪、相機事件廣播與方程式解析。

### O6 · 2026-09-05 00:55:00+08:00 — 清除 camera_command 偽操作與 camera_change 舊膠水代碼
依據審查意見徹底修正抽象錯配：
1. `commands.ts` 中的 `camera_command` 移除假的 `core.reversible_operation` 實作（徹底清除 dummy `execute`/`inverse`），明確定位為 renderer-local 視口命令。
2. `index.ts` 與 `renderer.ts` 清除 `camera_change` 偽世界 Hook，相機異動改由 Renderer 直接訂閱自身 Camera 實例觸發重繪，`world_init` 僅保留正當世界層級事件（`device_change` / `history_change`）。

### O7 · 2026-09-05 00:59:00+08:00 — 確立 camera instance -> target_world.trigger 直連橋接
依據審查原則確立 `world └─ camera instance └─ listeners` 架構：
1. `basic_renderer:camera_change` 登記為正式世界 Hook 槽位（於 `global_init` 宣告）。
2. 在 `get_world_camera` 建立 world-specific 相機實例時，直接將 `cam.on_change` 接至 `target_world.trigger({ namespace: 'basic_renderer', id: 'camera_change' }, c)`，完全避免中介全域回呼或可變事件狀態。
3. `tests/basic_renderer.test.ts` 6 項測試全數通過。

### O8 · 2026-09-05 01:39:00+08:00 — 清理 basic_renderer/assets 未引用靜態圖稿
經 /grill-me 邊界審查確認，draw_grid.ts 已全面採用程序化向量繪製，assets/（grid.svg、another_grid.svg）在 Runtime 完全未被載入，屬冗餘資產；已將 assets/ 徹底移除，並同步修正 draw_grid.ts 註解描述，保持 basic_renderer 模組代碼純淨。

---

## 待辦

### 1 移除全域狀態並實例化 camera 模組 (Instance-based Camera & Eliminate Global Lookups)
- **state:** 等待確認
- **basis:** → O1, O2

將 `src/packs/basic_renderer/camera.ts` 與 `camera_control.ts` 的全域變數重構為具備獨立狀態與事件訂閱機制的 `class camera`，相機控制函式全面轉為實例方法或接收相機實例，徹底移除對 `@/world` 的 `get_map` 呼叫。

**沿革**

- H1 · 2026-09-04 03:15 決斷 —— 確立 Camera 實例化與零全域查詢設計（human）
- H2 · 2026-09-04 03:16 落地 —— 完成 class camera 與相機控制函式實例化重構（agent: gemini-3.8-flash-high） → O2

### 2 實例化 basic_renderer 並接軌 target_world (Instance-based Renderer with World Hooks)
- **state:** 等待確認
- **basis:** → O1, O3

在 `src/packs/basic_renderer/renderer.ts` 實作 `class basic_renderer`（或 `create_renderer`），建構時明確接收 `target_world: world.pure_world`，自 `target_world.space` 讀取維度與裝置進行繪製；移除舊版無效全域監聽，改為注入 `target_world` 的 `device_change`、`history_change` 與相機內部變更來觸發排程重繪。

**沿革**

- H1 · 2026-09-04 03:15 決斷 —— 確立 Renderer 明確接收 target_world 並綁定事件（human）
- H2 · 2026-09-04 03:16 落地 —— 實作 class basic_renderer 並對接 target_world 空間與 hooks（agent: gemini-3.8-flash-high） → O3

### 3 對齊 index.ts 公開進入點與 CLI Camera 指令定位 (Harmonize Entrypoint & Camera Command)
- **state:** 等待確認
- **basis:** → O1, O4, O6, O7

更新 `src/packs/basic_renderer/index.ts` 導出現代化實例工廠與介面；確定 `camera_command` 作為純 Viewport 控制指令，不產生冗餘的 Undo Tree 空間歷史。

**沿革**

- H1 · 2026-09-04 03:15 決斷 —— camera_command 定位為純 Viewport 控制，不進 History（human）
- H2 · 2026-09-04 03:16 落地 —— 完成公開進入點精簡與 camera_command 契約對齊（agent: gemini-3.8-flash-high） → O4
- H3 · 2026-09-05 00:55 落地 —— 移除假的 reversible_operation 並清除 camera_change 舊膠水（agent: gemini-3.8-flash-high） → O6
- H4 · 2026-09-05 00:59 落地 —— 建立 camera instance 直連世界 hook 橋接並通過測試（agent: gemini-3.8-flash-high） → O7

### 4 整合測試驗證多世界多視口隔離 (Integration Verification & Multi-World Isolation Tests)
- **state:** 等待確認
- **basis:** → O1, O5, O6, O7

撰寫 `tests/basic_renderer.test.ts`，驗證多個世界實例各自建立 Renderer 時，相機視口、縮放與空間重繪完全互不干擾，並通過 `npx tsc -b` 驗證。

**沿革**

- H1 · 2026-09-04 03:15 決斷 —— 建立多世界渲染隔離測試（human）
- H2 · 2026-09-04 03:16 落地 —— tests/basic_renderer.test.ts 5 項測試全數通過（agent: gemini-3.8-flash-high） → O5

### 5 清理 basic_renderer 未引用靜態資源 (Cleanup Unused Static Assets)
- **state:** 等待確認
- **basis:** → O8

清理 `src/packs/basic_renderer/assets/` 目錄與未被邏輯引用的 SVG 檔案，並對齊 `draw_grid.ts` 樣式註解。

**沿革**

- H1 · 2026-09-05 01:38 決斷 —— 經 /grill-me 確認 assets/ 不進生產代碼，徹底移除（human）
- H2 · 2026-09-05 01:39 落地 —— 刪除 assets/ 檔案並對齊 draw_grid.ts 註解（agent: gemini-3.8-flash-low） → O8

