# 0027_202608220318_camera-slice-depth-semantics

- **status:** done
- **prev:** `./0026_202608220311_d4-transform-anchor-alignment.md`
- **skill:** plan-history v3

## 主題簡述

確立相機切片深度（Camera Plane Slices）在非顯示維度上採用整數基準點 $Z$，且嚴格僅顯示 $[Z, Z+3)$ 深度窗口內之實體方塊與連接埠。
此規則使得 $Z=0$ 時精確涵蓋 $[0, 3)$（包含底層樓板垂直埠 $Z=0$、本層水平埠與單元格中心 $Z=1$、天花板跨層垂直埠 $Z=2$），統一 `basic_renderer`、`layered_2d`、CMD 指令與 UI 選單。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，渲染切片邏輯位於 Renderer 與 UI 插件層，僅透過 `@/API` 互動。
- 拒絕隱性補齊，切片深度與維度嚴格匹配。

## 規劃描述

1. **確立相機切片深度幾何標準**：
   - 相機非投影軸切片以任意整數 $Z$ 為基準，顯示空間窗口為 $[Z, Z+3)$。
   - 單元格 $[coord, coord+2)$ 與切片相交條件：`coord < slices[i] + 3 && coord + 2 > slices[i]`。
   - 端口點座標 $wp[i]$ 可見條件：`wp[i] >= slices[i] && wp[i] < slices[i] + 3`。
2. **統一 Layer Selector 與 Camera 切片設定**：
   - `layer_selector.ts` 支援選擇任意整數 $Z$，標記為 `Z = z (Depth [z, z+3))`。
3. **完成驗證與同步**：
   - 驗證預設切片 $Z=0$（區間 $[0, 3)$）在 2.5D 與多維切片視圖下的完整渲染。

## 觀察與推論

### O1 · 2026-08-22 03:07:00+08:00 — 樓層錨點與切面中心之切片雙重性
在 2× Grid 系統中，第 $k$ 層樓佔據 $Z \in [2k, 2k+2)$。採用 $[Z, Z+3)$ 深度窗口時：
- $Z=0$ 涵蓋 $Z \in [0, 3)$，完整包含第 0 層樓板垂直埠 ($Z=0$)、水平埠 ($Z=1$) 與頂部交接垂直埠 ($Z=2$)。
- $Z=2$ 涵蓋 $Z \in [2, 5)$，完整包含第 1 層的完整三向埠位。

## 待辦

### 1 確立相機切片深度標準並統一 Renderer 與 Layer Selector 語意
- **state:** 完成
- **basis:** → O1

落實 $[Z, Z+3)$ 切片深度窗口規則，同步 `basic_renderer`、`layered_2d`、`base_test_device` 與 `layer_selector.ts`。

**沿革**

- H1 · 2026-08-22 03:18 決斷 —— 開立計畫統一相機切片深度幾何語意與選擇器標準（使用者）
- H2 · 2026-08-22 03:20 決斷 —— 確立切片基準為任意整數 $Z$，且嚴格僅顯示 $[Z, Z+3)$ 範圍內容（使用者指示）
- H3 · 2026-08-22 03:22 落地 —— 完成 `draw_device`、`renderer`、`base_test_device` 與 `layer_selector` 之 $[Z, Z+3)$ 窗口過濾與 UI 選單同步（Agent）
