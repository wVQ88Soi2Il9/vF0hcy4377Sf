# 0010_202608131951_ghost-layer-half-open

- **status:** done
- **prev:** 0009_202608131816_ghost-layer-design.md
- **skill:** plan-history v3

## 主題簡述

[0, 2) 半開區間邊界與切面 Ghost Layer 渲染邏輯調整。

## 觀察與推論

### O1 · 2026-08-13 19:51:00+08:00 — 半開區間邊界 Ghost Layer
當非顯示維度最大偏離距離 $max\_slice\_dist === 1$ 時判定為 Ghost Item 以半透明繪製，當 $max\_slice\_dist === 0$ 時判定為 Active Item。

## 待辦

### 1 半開區間邊界 Ghost Layer 計算優化
- **state:** 完成
- **basis:** → O1

依據設備非顯示維度的完整區間 $[min_i, max_i]$ 計算與切片 $S_i$ 的最短距離，當 $max\_slice\_dist === 1$ 時判定為 Ghost Item 以半透明繪製，當 $max\_slice\_dist === 0$ 時判定為 Active Item。

**沿革**
- H1 · 2026-08-13 19:51 落地 —— 完成半開區間邊界 Ghost Layer 邏輯調整 → O1
