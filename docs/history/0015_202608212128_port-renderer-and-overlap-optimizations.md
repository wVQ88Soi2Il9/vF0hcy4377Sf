# 0015_202608212128_port-renderer-and-overlap-optimizations

- **status:** done
- **prev:** `./0014_202608200251_variable-shape-device.md`
- **skill:** plan-history v3

## 主題簡述

從實驗性分支（`dev/oop`）移植確定安全且無關底層 OOP 重構之畫面渲染與演算法優化至 `master` 主線，包含網格 SVG 高清化與消除模糊、地圖外框線條加粗外擴、移除相鄰幽靈圖層、精簡 Vanilla 碰撞檢測演算法並消除 `?? 0` 隱性補齊，以及同步更新 `AGENTS.md` 分支豁免規範。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構。
- 拒絕隱性補齊（No Implicit Zero-Padding），移除 `?? 0`。

## 規劃描述

1. **網格材質高清化 (`src/packs/basic_renderer/assets/grid.svg` & `draw_grid.ts`)**：重構 `grid.svg` 為純整數 2×2 網格與 `crispEdges`，於 `draw_grid.ts` 停用 Canvas 雙線性插值（`imageSmoothingEnabled = false`）並校準 tile size 為 64。
2. **地圖邊界線條加粗與外擴 (`src/packs/basic_renderer/draw_grid.ts`)**：線寬提升至 `Math.max(4, camera.zoom * 0.08)`，外擴半個線寬（`Outer Border`）繪製，使邊框完全落在網格外側不遮擋內部像素。
3. **移除相鄰切片幽靈圖層與實作重疊紅色高亮 (`src/packs/basic_renderer/draw_device.ts`)**：移除 `ghost_items` 與 Pass 1 半透明繪製，僅渲染當前切片實體；並在渲染時呼叫 `trigger_check_overlap`，若裝置發生重疊則繪製淡紅色半透明矩形（`rgba(248, 113, 113, 0.45)`）與紅色內縮外框（`#ef4444`）（承接 0017）。
4. **精簡 Vanilla Overlap 演算法 (`src/packs/vanilla/overlap.ts`)**：移除 `?? 0` 隱性補齊，使用 `cells.some(...)` 與 `filter/flat` 管道化重構碰撞與邊界檢測。
5. **規範與 Agent 規則同步 (`AGENTS.md`)**：補充「實驗性分支免受既有規則拘束 (Experimental Branch Exemption)」條款。

## 觀察與推論

### O1 · 2026-08-21 21:28:00+08:00 — 獨立非底層更動之安全移植
經評估，SVG 網格材質、Canvas 渲染設定、地圖邊界外擴計算、相鄰切片幽靈圖層清理、重疊狀態視覺標註（0017）以及基於純陣列管道的 Overlap 重構，均完全獨立於 OOP 類別架構，可無縫移植至 `master` 主線並立即提升畫面細緻度與演算法簡潔度。

## 待辦

### 1 移植網格材質與外框邊界優化
- **state:** 完成
- **basis:** → O1

更新 `grid.svg` 與 `draw_grid.ts`，停用雙線性平滑並實作 Outer Border 外擴黑框。

**沿革**

- H1 · 2026-08-21 21:28 決斷 —— 確立移植 grid.svg、draw_grid.ts 與 draw_device.ts（使用者）
- H2 · 2026-08-21 21:28 落地 —— 完成 grid.svg、draw_grid.ts 與 draw_device.ts 之更新 → O1

### 2 移植 Overlap 演算法精簡與 AGENTS.md 規範
- **state:** 完成
- **basis:** → O1

精簡 `vanilla/overlap.ts` 消除 `?? 0`，修復 `loader.ts` 與動態配方型別定義衝突，並於 `AGENTS.md` 加入實驗性分支豁免條款。

**沿革**

- H1 · 2026-08-21 21:28 決斷 —— 確立精簡 overlap.ts 與同步 AGENTS.md（使用者）
- H2 · 2026-08-21 21:28 落地 —— 完成 overlap.ts 與 AGENTS.md 之修改 → O1
- H3 · 2026-08-21 21:30 修正 —— 修正 iterator Array.from、loader JSDoc 註解與 recipe 型別宣告衝突，驗證 build 成功（Agent）

### 3 於 Test Pack 建立通用繪圖雛形與重疊紅色高亮 (0017, 0019)
- **state:** 完成
- **basis:** → O1

於 `src/packs/test/$basic_renderer/base_device.ts` 實作通用繪圖範本 `draw_test_device_template`（包含 `alpha = 0.75`、內縮深色邊框、`#UID`、端口以及 `vanilla.check_map_overlap` 重疊淡紅色半透明矩形與 `#ef4444` 邊框包覆），重構所有 test pack 裝置繪圖函式，保持 `basic_renderer` 純粹解耦，並清理未使用之骰子圖片素材。

**沿革**

- H1 · 2026-08-21 21:34 決斷 —— 確立於 basic_renderer 統一為重疊裝置渲染淡紅色包覆（使用者）
- H2 · 2026-08-21 21:34 落地 —— 導出 trigger_check_overlap 並更新 draw_device.ts 實作紅色覆蓋渲染 → O1
- H3 · 2026-08-21 21:36 決斷 —— 依使用者指示不寫在 renderer 核心，改於 test pack 建立通用繪圖範本 base_device.ts（使用者）
- H4 · 2026-08-21 21:37 落地 —— 還原 draw_device.ts，建立 base_device.ts，重構 7 個 test 裝置繪圖函式並清理 test assets → O1
