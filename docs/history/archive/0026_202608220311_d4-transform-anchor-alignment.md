# 0026_202608220311_d4-transform-anchor-alignment

- **status:** done
- **prev:** `./0025_202608220230_port-parity-validation.md`
- **skill:** plan-history v3

## 主題簡述

解決 2.5D D4 幾何旋轉變換（Dihedral Group D4）中單元格「網格錨點（Anchor）」與「邊界端口（Port）」脫節錯位的問題。
確立單元格佔據 $[x, x+2) \times [y, y+2)$ 體積空間之中心旋轉映射法則，使單元格錨點變換（`apply_d4_cell_anchor`）與邊界端口變換（`apply_d4_point`）在旋轉與鏡射後維持 100% 幾何重合與連通性。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，數學運算位於 `src/packs/layered_2d/math.ts`。
- 拒絕隱性補齊，向量維度嚴格匹配。

## 規劃描述

1. **實作中心對齊 D4 變換函式**：於 `src/packs/layered_2d/math.ts` 區分：
   - `apply_d4_point(v, transform)`：用於邊界端口與點座標之直接旋轉/鏡射。
   - `apply_d4_cell_anchor(anchor, transform)`：以單元格中心 $(x+1, y+1)$ 進行 D4 變換並回推新錨點 $(c'_x-1, c'_y-1)$。
2. **重構 `base_layered_device`**：於 `base_device.ts` 中分別對 `get_shape()` 調用 `apply_d4_cell_anchor`，對 `get_port()` 調用 `apply_d4_point`。
3. **驗證幾何一致性**：驗證 1x1 belt、2x2 assembler 與 irregular_3d 在 90°、180°、270° 與鏡射翻轉下，端口與單元格邊界面精確貼合。

## 觀察與推論

### O1 · 2026-08-22 03:07:00+08:00 — 單元格錨點與頂點旋轉失真
單元格是佔據 $[x, x+2) \times [y, y+2)$ 的實體方塊，其中心為 $(x+1, y+1)$。若直接對錨點頂點 $[0, 0]$ 進行繞原點旋轉，旋轉 90° 仍得 $[0, 0]$；然而方塊中心 $(1, 1)$ 旋轉 90° 應變為 $(-1, 1)$（對應新錨點 $[-2, 0]$），而邊界端口 $[2, 1, 1]$ 旋轉 90° 變為 $[-1, 2, 1]$。若未對單元格中心進行修正，端口將漂移至單元格外側。

## 待辦

### 1 實作 D4 幾何變換中心對齊與單元格錨點修復
- **state:** 完成
- **basis:** → O1

於 `math.ts` 與 `base_device.ts` 實作單元格中心對齊變換，消除形狀與端口旋轉脫節問題。

**沿革**

- H1 · 2026-08-22 03:11 決斷 —— 開立計畫處理 D4 旋轉單元格錨點與端口錯位問題（使用者）
- H2 · 2026-08-22 03:13 落地 —— 實作 `apply_d4_cell_anchor` 與 `apply_d4_point`，重構 `base_layered_device` 並通過旋轉邊界貼合驗證（Agent）
- H3 · 2026-08-22 03:14 落地 —— 覆蓋 L 型、T 型、凹 U 型、3D 螺旋跨層、對角步階等 5 種複雜裝置共 40 組 D4 變換狀態之全偶數錨點、恰 1 偶數端口與圖連通性精確驗證（Agent）
