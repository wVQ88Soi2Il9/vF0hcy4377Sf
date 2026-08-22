# 0031_202608222126_add-pipeline-device

- **status:** done
- **prev:** ./0030_202608222118_rename-ui-panels.md
- **skill:** plan-history v3

## 主題簡述

新增管線類裝置 Pack（pipe pack，`pipe:pipe`），定義 `class pipe extends device`，具備 `[start_point] + [{direction, offset}, ...]` 向量與路徑描述結構，支援多維路徑轉換（如 `[0,0] [2,0] [4,0] [6,0] [6,2]` 轉換為 `[0,0] [d1(x), 4] [d2(y), 2]`），並具備專屬 draw 繪圖函式、端點 ports 計算與 basic_ui 擴充檢查面板。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 ;。
- 遵循三層單向架構，Pack 僅透過 @/API 互動。
- 遵循 2x Grid 座標規範：position 恆為全偶數網格座標，port 恰有 1 個維度為偶數、其餘為奇數。
- 拒絕隱性補齊。

## 規劃描述

1. **定義管線類裝置**：
   - 建立 `src/packs/pipe/types.ts` 與 `src/packs/pipe/devices/pipe.ts`（`pipe:pipe`），實作 `start_point` 與 `segments` 路徑表示法及雙向轉換輔助工具。
2. **UI 擴充與繪圖支援**：
   - 實作個別管線格子繪圖與端點 ports，並在 `src/packs/pipe/$basic_ui/pipe_inspector.ts` 擴充路徑資訊檢查器。
3. **驗證與測試**：
   - 執行編譯檢查確認無誤。
4. **完成狀態更新**。

## 觀察與推論

### O1 · 2026-08-22 21:26:45+08:00 — 新增管線類裝置需求
使用者指示新增管線類 device，擴充 Pack 裝置多樣性並驗證不同管線流向與 2x Grid 端口對齊能力。

## 待辦

### 1 實作並註冊管線類裝置（pipe）
- **state:** 完成
- **basis:** → O1

於 `src/packs/pipe` 中實作 `class pipe extends device`（`pipe:pipe`），定義 `[start_point] + [{direction, offset}, ...]` 屬性結構與路徑轉換工具，配置符合 Parity 邊界之 input / output ports 與專屬 draw 函式。

**沿革**

- H1 · 2026-08-22 21:26 決斷 —— 開立計畫新增管線類裝置（使用者）
- H2 · 2026-08-22 22:24 落地 —— 於 src/packs/pipe 實作 pipe 類別與路徑段表示法及繪圖邏輯（Agent）
