# 0019_202608210137_test-device-alpha-and-inner-border

- **status:** done
- **prev:** `./0018_202608210134_thicken-border-remove-ghost-layer.md`
- **skill:** plan-history v3

## 主題簡述

在 `test` pack 的裝置繪圖（`base_test_device.draw`）中設定半透明度 `alpha = 0.75`，並將矩形邊框繪製修正為完全落在網格內部（Inner Border）。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構。
- 拒絕隱性補齊。

## 規劃描述

1. 於 `src/packs/test/devices/base_test_device.ts` 的 `draw()` 函式使用 `ctx.save()` 與 `ctx.restore()` 設定 `ctx.globalAlpha = 0.75`。
2. 修正邊框（包含一般邊框與重疊紅色外框）為內縮繪製：`ctx.strokeRect(sx + half_lw, sy + half_lw, sw - lw, sh - lw)`，確保外邊緣完全在網格 cell 內部。

## 觀察與推論

### O1 · 2026-08-21 01:37:18+08:00 — 裝置半透明與內置邊框繪圖調整
Canvas 2D 的 `strokeRect` 預設以路徑中心向兩側擴展線寬，導致外側溢出半個線寬。透過內縮 `lineWidth / 2` 繪製可使外邊緣與網格完美切齊；同時設置 `alpha = 0.75` 呈現半透明材質感。

## 待辦

### 1 於 base_test_device.draw 設定 alpha=0.75 與邊框內縮
- **state:** 完成
- **basis:** → O1

在 `src/packs/test/devices/base_test_device.ts` 中調整 `draw()` 實作：加入 `globalAlpha = 0.75` 並將一般邊框與重疊外框內縮於 grid cell 內部。

**沿革**

- H1 · 2026-08-21 01:37 決斷 —— 確立 test 裝置半透明 alpha=0.75 與邊框完全在 grid 內部（使用者）
- H2 · 2026-08-21 01:37 落地 —— 於 base_test_device.draw 實作 globalAlpha=0.75 與 strokeRect 內縮 half_lw 繪製 → O1
