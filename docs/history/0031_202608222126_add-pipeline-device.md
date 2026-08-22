# 0031_202608222126_add-pipeline-device

- **status:** in-progress
- **prev:** ./0030_202608222118_rename-ui-panels.md
- **skill:** plan-history v3

## 主題簡述

在 test pack 中新增管線類裝置（Pipeline / Pipe Device，例如 test:pipe），具備標準 2x Grid 座標錨點、形狀與符合奇偶性校驗的輸入輸出連接埠（Ports），並支援 2.5D D4 旋轉、自定義顏色主題與基本 UI 互動。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 ;。
- 遵循三層單向架構，Pack 僅透過 @/API 互動。
- 遵循 2x Grid 座標規範：position 恆為全偶數網格座標，port 恰有 1 個維度為偶數、其餘為奇數。
- 拒絕隱性補齊。

## 規劃描述

1. **定義管線類裝置**：
   - 建立 src/packs/test/devices/pipe.ts（	est:pipe），設定 ase_shape 為單元格 [0, 0, 0]，連接埠如 [0, 1, 1]（Input）與 [2, 1, 1]（Output），並賦予管線專屬色彩主題（如青色/湖水藍）。
2. **驗證與測試**：
   - 驗證 loader 自動發現與載入 	est:pipe。
   - 執行 
pm run build 確認編譯無誤。
3. **完成狀態更新**。

## 觀察與推論

### O1 · 2026-08-22 21:26:45+08:00 — 新增管線類裝置需求
使用者指示新增管線類 device，擴充 Pack 裝置多樣性並驗證不同管線流向與 2x Grid 端口對齊能力。

## 待辦

### 1 實作並註冊管線類裝置（pipe）
- **state:** 待實作
- **basis:** → O1

於 	est pack 中實作管線裝置 	est:pipe，繼承 ase_test_device，配置標準 2x 網格尺寸與符合 Parity 邊界之 input / output ports，並提供專屬色彩主題。

**沿革**

- H1 · 2026-08-22 21:26 決斷 —— 開立計畫新增管線類裝置（使用者）
