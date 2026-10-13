# 0018_202608210134_thicken-border-remove-ghost-layer

- **status:** done
- **prev:** `./0017_202608210129_test-pack-draw-overlapped-overlay.md`
- **skill:** plan-history v3

## 主題簡述

加粗地圖邊界線條（`draw_grid`），並移除相鄰切片的半透明透視幽靈圖層（`draw_devices` 中的 ghost items），僅保留當前切片實體裝置繪製。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，`basic_renderer` 僅依賴 Core 型別與 Utils。
- 拒絕隱性補齊。

## 規劃描述

1. **加粗地圖邊界**：於 `src/packs/basic_renderer/draw_grid.ts` 中調大 `ctx.lineWidth`。
2. **移除半透明透視**：於 `src/packs/basic_renderer/draw_device.ts` 中移除 `ghost_items` 收集與 Pass 1 半透明渲染，僅保留 `active_items`（距離當前切片 = 0）。

## 觀察與推論

### O1 · 2026-08-21 01:34:02+08:00 — 渲染層視覺調整與簡化
地圖外框需更醒目的邊界識別；相鄰切片的半透明透視在多維空間中易造成視覺干擾，移除後僅渲染當前切片實體。目前實體層之間裝置的繪圖順序遵循 `map.devices` 陣列的原生順序。

## 待辦

### 1 加粗地圖邊界外框線條
- **state:** 完成
- **basis:** → O1

於 `src/packs/basic_renderer/draw_grid.ts` 中加粗地圖外框 `lineWidth`。

**沿革**

- H1 · 2026-08-21 01:34 決斷 —— 確立地圖邊界線條加粗（使用者）
- H2 · 2026-08-21 01:34 落地 —— 提升 draw_grid.ts 的外框線寬至 Math.max(4, zoom * 0.08) → O1

### 2 移除裝置繪製中的相鄰半透明透視圖層
- **state:** 完成
- **basis:** → O1

於 `src/packs/basic_renderer/draw_device.ts` 移除 `ghost_items` 與 Pass 1 渲染邏輯，僅渲染當前切片實體。

**沿革**

- H1 · 2026-08-21 01:34 決斷 —— 確立移除半透明透視圖層（使用者）
- H2 · 2026-08-21 01:34 落地 —— 清理 draw_device.ts 中的 ghost_items 收集與 Pass 1 繪製迴圈 → O1
