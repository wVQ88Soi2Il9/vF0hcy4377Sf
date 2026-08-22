# 0033_202608230209_ef-pack-oop-simplification-and-pipes

- **status:** in-progress
- **prev:** ./0032_202608222202_layered-2d-rotate-flip-api-and-ui.md
- **skill:** plan-history v3

## 主題簡述

針對 EF Pack 進行 OOP 架構與能力介面重構（Final Pack 規範改採 `implements` 能力契約）、精簡 `base_ef_device` 多餘欄位，並為 EF Pack 新增 3 種管線設備（`solidpipe`、`liquidpipe`、`gaspipe`）。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- EF 作為 Final Pack，橫向能力採用 `implements`（如 `drawable_layered_device`, `rotatable_device`）組合能力契約。
- 拒絕隱性補齊。

## 規劃描述

1. **EF 設備類別重構為 `implements` 能力契約**：
   - 依據 Final Pack 規範，`base_ef_device` 改為 `extends device implements drawable_layered_device, rotatable_device`（或組合介面）。
2. **精簡類別欄位**：
   - 移除 `machine_def` 等多餘欄位，將資料最小化收納至 `other_info`，降低物件冗餘。
3. **新增 3 種 EF Pipe 設備**：
   - 實作/註冊 `solidpipe`（固體傳送管）、`liquidpipe`（液體輸送管）、`gaspipe`（氣體輸送管）。
4. **驗證與建構**：
   - 執行 `npm run build` 確認編譯通過。

## 觀察與推論

### O1 · 2026-08-23 02:08:56+08:00 — EF Pack 簡化與 Pipe 擴充需求
使用者指示：
1. `src/packs/ef/base_device.ts` 中，EF 是 Final Pack，應使用 `implements` 契約。
2. 精簡無意義欄位（如 `public readonly machine_def: machine`）。
3. EF 新增 3 種管線：`solidpipe`、`liquidpipe`、`gaspipe`。

## 待辦

### 1 重構 base_ef_device 為 implements 能力契約並精簡欄位
- **state:** 待實作
- **basis:** → O1

將 `base_ef_device` 重構為直接繼承 `device` 並 `implements drawable_layered_device, rotatable_device`，移除 `public readonly machine_def` 等多餘欄位，極致精簡物件屬性。

**沿革**

- H1 · 2026-08-23 02:09 決斷 —— 開立待辦進行 base_ef_device 能力介面轉型與欄位精簡（使用者）

### 2 EF Pack 新增 3 種管線設備 (solidpipe, liquidpipe, gaspipe)
- **state:** 待實作
- **basis:** → O1

於 EF Pack 中實作並註冊 `solidpipe`（固體管）、`liquidpipe`（液體管）、`gaspipe`（氣體管），支援 2.5D 管道連線與對應物態傳輸。

**沿革**

- H1 · 2026-08-23 02:09 決斷 —— 開立待辦實作 EF 專屬的三種物態管線（使用者）
