# 0020_202608210139_crisp-svg-grid-pattern

- **status:** done
- **prev:** `./0019_202608210137_test-device-alpha-and-inner-border.md`
- **skill:** plan-history v3

## 主題簡述

採用方案 B 解決網格模糊問題：重構 `grid.svg` 為純整數座標與 `shape-rendering="crispEdges"`，並在 `draw_grid.ts` 停用 Canvas 雙線性插值平滑（`imageSmoothingEnabled = false`）以實現清晰銳利的網格材質。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構。
- 拒絕隱性補齊。

## 規劃描述

1. **重構 SVG 資產**：修改 `src/packs/basic_renderer/assets/grid.svg`，移除浮點數次像素誤差，改為純整數座標並設定 `shape-rendering="crispEdges"`。
2. **優化網格渲染**：修改 `src/packs/basic_renderer/draw_grid.ts`，設定 `ctx.imageSmoothingEnabled = false` 並校準縮放比例。

## 觀察與推論

### O1 · 2026-08-21 01:39:49+08:00 — SVG 柵格化與 Canvas 平滑插值致模糊
原 `grid.svg` 帶有 Inkscape 匯出的小數點次像素座標，且 Canvas 預設開啟雙線性插值平滑，造成 Pattern 縮放時產生模糊。透過乾淨整數向量、`crispEdges` 與停用平滑可大幅改善銳利度。

## 待辦

### 1 重構 grid.svg 為純整數與 crispEdges
- **state:** 完成
- **basis:** → O1

將 `src/packs/basic_renderer/assets/grid.svg` 整理為純整數 2×2 網格並加上 `shape-rendering="crispEdges"`。

**沿革**

- H1 · 2026-08-21 01:39 決斷 —— 確立採用方案 B 重構整數 SVG 與停用平滑（使用者）
- H2 · 2026-08-21 01:40 落地 —— 簡化 grid.svg 為乾淨整數座標與 crispEdges → O1

### 2 於 draw_grid 停用雙線性平滑與校準比例
- **state:** 完成
- **basis:** → O1

在 `src/packs/basic_renderer/draw_grid.ts` 設置 `ctx.imageSmoothingEnabled = false` 並確保 pattern 縮放比例精確對齊。

**沿革**

- H1 · 2026-08-21 01:39 決斷 —— 確立 draw_grid 停用平滑（使用者）
- H2 · 2026-08-21 01:40 落地 —— 加入 imageSmoothingEnabled=false 並校準 SVG_TILE_SIZE=64 → O1
