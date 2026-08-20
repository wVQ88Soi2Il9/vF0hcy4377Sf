# 0022_202608210204_refactor-vanilla-overlap-streamline

- **status:** done
- **prev:** `./0021_202608210142_outer-boundary-border.md`
- **skill:** plan-history v3

## 主題簡述

重構 `src/packs/vanilla/overlap.ts`，採用現代函數式方法（`some`、`filter`、`flat`）精簡兩階段碰撞與出界檢測演算法，消除冗餘旗標變數與多層巢狀迴圈，並強化相異裝置重疊防護。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，僅引用 `@/API` 與 `@/utils/*`。
- 拒絕隱性補齊。

## 規劃描述

1. 於 `src/packs/vanilla/overlap.ts` 中使用 `cells.some(...)` 取代手動 `is_oob` 旗標與判斷。
2. 使用 `occupied_map.values()` 配合 `filter(ids => new Set(ids).size > 1).flat()` 與 `new Set()` 管道式收集重疊裝置 UID。
3. 保持 Allman 風格與乾淨排版，大幅降低圈複雜度。

## 觀察與推論

### O1 · 2026-08-21 02:04:59+08:00 — 空間檢測邏輯之函數式精簡
傳統命令式寫法包含 `is_oob` 旗標維護與雙層 `for...of` 收集迴圈。透過 `some` 早期中斷與 `flat` 陣列壓平，可在維持演算法等價的同時大幅減少樣板代碼。

## 待辦

### 1 重構 overlap.ts 空間檢查演算法
- **state:** 完成
- **basis:** → O1

使用 `some` 與 `flat` 重構 `src/packs/vanilla/overlap.ts` 之 `check_map_overlap` 實作。

**沿革**

- H1 · 2026-08-21 02:04 決斷 —— 確立採用 some/flat 函數式精簡 overlap.ts（使用者）
- H2 · 2026-08-21 02:05 落地 —— 完成 overlap.ts 重構，使用 some 與 flat/filter 管道化消除巢狀迴圈 → O1
