# 0037_202608230317_ef-pack-implements-cuboid-device

- **status:** done
- **prev:** ./0036_202608230258_api-get-dimension-helper.md
- **skill:** plan-history v3

## 主題簡述

使 EF Pack 設備（`base_ef_device` 與所有衍生機器）直接實作 `cuboid_device` 能力介面契約，具備 `device_size` 跨度屬性，並將局部 Shape 計算委派給 `cuboid_device` 的 `cuboid_to_shape` 適配器。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- EF 作為 Final Pack，橫向能力採用 `implements cuboid_device, drawable_layered_device, rotatable_device`。
- 拒絕隱性補齊，跨度向量維度與幾何資料嚴格匹配。
- 更新後執行 `python docs/history/update-head.py` 確保 `head.md` 同步。

## 規劃描述

1. **定義 `cuboid_device` 能力介面契約 (`src/packs/cuboid_device/types.ts`)**：
   - 定義 `cuboid_device` 介面，規範 `readonly device_size: vector`。
2. **更新 `cuboid_device` 基礎類別與進入點**：
   - `base_cuboid_device` 宣告 `implements cuboid_device`。
   - `index.ts` 導出 `cuboid_device` 型別與物件。
3. **重構 `base_ef_device` 實作 `cuboid_device`**：
   - `base_ef_device` 增加 `implements cuboid_device` 與 `public readonly device_size: vector_3d`。
   - Shape 初始化改以 `cuboid_to_shape(this.device_size)` 計算。
4. **驗證與同步**：
   - 執行 `npm run build` 確認建構通過。
   - 執行 `python docs/history/update-head.py`。

## 觀察與推論

### O1 · 2026-08-23 03:15:56+08:00 — EF Pack 實作 cuboid_device
使用者指示：
ef pack 的 machine / device 目前都能直接 implements cuboid_device。

## 待辦

### 1 定義 cuboid_device 介面並使 base_ef_device 實作 cuboid_device
- **state:** 完成
- **basis:** → O1

於 `cuboid_device` 定義能力介面契約，並讓 `base_ef_device` 實作 `cuboid_device`、提供 `device_size` 並由 `cuboid_to_shape` 生成單元格 shape。

**沿革**

- H1 · 2026-08-23 03:17 決斷 —— 開立待辦使 EF Pack 設備實作 cuboid_device（使用者）
- H2 · 2026-08-23 03:18 落地 —— 定義 cuboid_device 介面並重構 base_ef_device 實作 cuboid_device，通過建構驗證（Agent） → O1
- H3 · 2026-08-23 03:31 落地 —— 簡化架構改由 base_ef_device 直接繼承 base_cuboid_device，device_size 套用 [m.width * 2, m.height * 2, 2] 並透過 super.get_shape() 取得單元格（Agent）
- H4 · 2026-08-23 03:33 落地 —— 徹底移除 base_shape, base_input_ports, base_output_ports 冗餘實例欄位，改以動態委派運算（Agent）
- H5 · 2026-08-23 03:35 落地 —— 改為 extends device implements base_cuboid_device 並精簡整個 base_device.ts 實作（Agent）
- H6 · 2026-08-23 03:38 落地 —— 全面移除 layered_2d 與 ef pack 中無意義的 get_shape_3d / get_port_3d 別名函式（Agent）
- H7 · 2026-08-23 03:42 落地 —— 改為 extends base_layered_device 繼承 2.5D 幾何邏輯，大幅精簡 base_ef_device.ts 樣板方法（Agent）
