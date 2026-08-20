# 0017_202608210129_test-pack-draw-overlapped-overlay

- **status:** done
- **prev:** `./0016_202608210125_complete-vanilla-pack.md`
- **skill:** plan-history v3

## 主題簡述

在 `test` pack 的裝置繪圖邏輯（`base_test_device.draw`）中引入重疊狀態（`overlapped`）判斷與視覺反饋，當檢測到裝置發生重疊時以淡紅色半透明包覆。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，`test` pack 僅透過 `@/packs/basic_renderer`、`@/packs/vanilla` 與 `@/runtime` 進行互動。
- 拒絕隱性補齊。

## 規劃描述

1. 於 `src/packs/test/devices/base_test_device.ts` 中導入 `@/runtime` 的 `get_map` 與 `@/packs/vanilla` 的 `vanilla`。
2. 於 `base_test_device.draw()` 內透過 `vanilla.check_map_overlap(map)` 判斷當前裝置 `uid` 是否發生重疊。
3. 若 `overlapped === true`，於裝置主體與邊框繪製完成後，以淡紅色半透明矩形（`rgba(248, 113, 113, 0.45)`）及紅色外框（`#ef4444`）進行包覆。

## 觀察與推論

### O1 · 2026-08-21 01:29:29+08:00 — Test Pack 重疊狀態視覺化反饋
`vanilla` pack 提供了 `check_map_overlap` 碰撞檢測演算法。在 `base_test_device` 繪圖流程中調用該檢測並判斷自身 `uid` 是否重疊，可在畫布上即時以淡紅色視覺包覆標註衝突裝置。

## 待辦

### 1 於 base_test_device.draw 加入重疊淡紅色包覆渲染
- **state:** 完成
- **basis:** → O1

在 `src/packs/test/devices/base_test_device.ts` 中引入 `get_map` 與 `vanilla.check_map_overlap`，並在 `draw()` 函式內實作重疊時的淡紅色包覆渲染。

**沿革**

- H1 · 2026-08-21 01:29 決斷 —— 確立 base_test_device.draw 重疊狀態淡紅色包覆視覺反饋（使用者）
- H2 · 2026-08-21 01:30 落地 —— 引入 vanilla.check_map_overlap 實作 overlapped 淡紅色半透明矩形與外框包覆渲染 → O1
