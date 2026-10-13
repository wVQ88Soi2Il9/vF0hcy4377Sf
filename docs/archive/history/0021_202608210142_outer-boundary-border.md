# 0021_202608210142_outer-boundary-border

- **status:** done
- **prev:** `./0020_202608210139_crisp-svg-grid-pattern.md`
- **skill:** plan-history v3

## 主題簡述

將地圖邊界黑框線條調整為完全落在網格世界範圍外部（Outer Border），使線條內緣與地圖邊界切齊，完全不遮擋網格內部像素。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構。
- 拒絕隱性補齊。

## 規劃描述

在 `src/packs/basic_renderer/draw_grid.ts` 中，將地圖黑框的繪製矩形外擴半個線寬（`half_lw = lw / 2`），使用 `ctx.strokeRect(sx - half_lw, sy - half_lw, sw + lw, sh + lw)` 繪製，確保線條完全分佈在網格外部。

## 觀察與推論

### O1 · 2026-08-21 01:42:00+08:00 — 地圖邊界線條外擴繪製
Canvas 2D 的 `strokeRect` 預設向路徑兩側均勻延伸。若將繪製矩形外擴 `lineWidth / 2`，其線條內邊緣剛好與地圖區域邊界切齊，使整個邊框完全落在 grid 外側。

## 待辦

### 1 將 draw_grid 邊界黑框改為外擴繪製
- **state:** 完成
- **basis:** → O1

在 `src/packs/basic_renderer/draw_grid.ts` 中修正黑框座標為 `sx - half_lw, sy - half_lw, sw + lw, sh + lw`。

**沿革**

- H1 · 2026-08-21 01:42 決斷 —— 確立地圖邊界黑框完全在 grid 外部（使用者）
- H2 · 2026-08-21 01:42 落地 —— 修正 draw_grid.ts 黑框為外擴 half_border_lw 繪製 → O1
