# 0056_202609050145_extract-camera-pack

- **status:** in-progress
- **prev:** ./0055_202609040315_basic-renderer-world-instance-refactor.md
- **skill:** plan-history v3

## 主題簡述

將相機、視口控制、投影與 CLI 命令自 basic_renderer 抽離至獨立的 src/packs/camera Pack，使 basic_renderer 專注於 Canvas 渲染。

---

## 觀察與推論

### O1 · 2026-09-05 01:45:00+08:00 — 相機與渲染邊界審查與共識
經 /grill-me 深入訪談與雙向論證，確立 basic_renderer 與 camera 職責分離邊界：相機狀態（class camera）、視口控制函式（camera_control.ts）、投影轉換（projection.ts / grid_to_screen）與 CLI 相機指令（commands.ts）全數遷移至獨立 Pack src/packs/camera；basic_renderer 僅保留 Canvas 生命週期、重繪排程與網格/裝置繪製演算法。

### O2 · 2026-09-05 01:48:00+08:00 — 完成 src/packs/camera 獨立模組實作
建立 src/packs/camera Pack：封裝 types.ts、camera.ts、camera_control.ts、projection.ts 與 commands.ts；global_init 登記 pack_id: 'camera' 與 camera_change Hook 槽位；world_init 建立世界專屬相機實例並直連 camera_change 事件。

### O3 · 2026-09-05 01:49:00+08:00 — 完成 basic_renderer 瘦身與相機解耦
清理 basic_renderer 內冗餘的 camera.ts、camera_control.ts 與 commands.ts；types.ts 保留 drawable_device 並以 camera.camera_type 定義簽章；draw_grid.ts、draw_device.ts 與 renderer.ts 依據規範以命名空間 import * as camera from '@/packs/camera' 接入相機；world_init 保持專注於裝置與歷史異動排程重繪。

### O4 · 2026-09-05 01:50:00+08:00 — 測試驗證通過
撰寫 tests/camera.test.ts 覆蓋 5 項相機核心測試；更新 tests/basic_renderer.test.ts 驗證多世界渲染隔離與世界 hooks 重繪；8 項單元測試全數通過。

### O5 · 2026-09-05 03:29:00+08:00 — camera 重構為純函式投影運算器與 Pipeline 渲染主入口
經 /grill-me 審查，確立 camera「不必過度追求解耦」，回歸極致純函式管線：(space, args) => projection，並作為 Pipeline 渲染主入口直連 basic_renderer.render。空間裝置遵循「接觸即傳」，原物件透通傳遞，內部零 class、零狀態。

---

## 待辦

### 1 建立獨立 src/packs/camera 模組 (Implement Standalone Camera Pack)
- **state:** 等待確認
- **basis:** → O1, O2, O5

建立 `src/packs/camera/`，封裝相機實例、視口平移/縮放控制、grid_to_screen 投影換算與 CLI camera 指令，並於 global_init 註冊 camera_change hook。

**沿革**

- H1 · 2026-09-05 01:45 決斷 —— 確立 camera 獨立 pack 設計與邊界（human）
- H2 · 2026-09-05 01:48 落地 —— 建立 src/packs/camera 並完成各子模組（agent: gemini-3.8-flash-high） → O2
- H3 · 2026-09-05 03:30 落地 —— 完成 types.ts、projection.ts、render.ts 與 index.ts 純函式模組實作（agent: gemini-3.8-flash-high） → O5

### 2 解耦並精簡 basic_renderer 職責 (Decouple & Streamline basic_renderer)
- **state:** 等待確認
- **basis:** → O1, O3

移除 basic_renderer 內的相機與指令檔案，改以命名空間引入 `@/packs/camera`；型別與繪製函式對齊相機合約，保持渲染器專注於 Canvas 繪圖與排程。

**沿革**

- H1 · 2026-09-05 01:45 決斷 —— basic_renderer 僅保留繪圖與畫布排程（human）
- H2 · 2026-09-05 01:49 落地 —— 刪除 camera/commands 檔案並對齊命名空間引用（agent: gemini-3.8-flash-high） → O3

### 3 拆分並補齊獨立單元測試 (Separate Unit Tests & Verification)
- **state:** 等待確認
- **basis:** → O1, O4, O5

建立 `tests/camera.test.ts` 驗證相機獨立運作；更新 `tests/basic_renderer.test.ts` 驗證多世界渲染與世界 hooks 重繪。

**沿革**

- H1 · 2026-09-05 01:45 決斷 —— 拆分測試為 camera.test.ts 與 basic_renderer.test.ts（human）
- H2 · 2026-09-05 01:50 落地 —— 撰寫測試並通過全數 8 項單元測試（agent: gemini-3.8-flash-high） → O4
- H3 · 2026-09-05 03:30 落地 —— 更新 tests/camera.test.ts 覆蓋切片、接觸即傳、任意雙軸與 Pipeline 渲染，全數測試通過（agent: gemini-3.8-flash-high） → O5
