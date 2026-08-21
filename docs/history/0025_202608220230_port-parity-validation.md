# 0025_202608220230_port-parity-validation

- **status:** done
- **prev:** `./0024_202608212235_generic-2-5d-pack.md`
- **skill:** plan-history v3

## 主題簡述

確立並校準 2x Grid 座標體系（position $\in (2\mathbb{Z})^n$ 全偶數中心座標、Port 邊界 $\text{port} \in \{x \in \mathbb{Z}^n : \text{恰有 1 個維度為奇數，其餘 } n-1 \text{ 個維度為偶數}\}$），建立 Parity 奇偶性校驗斷言機制，並確保 README 與全域文檔規範、CMD 驗證、UI 與渲染器完全精確對齊。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，校驗邏輯位於 Core / Utils，Pack 僅透過 `@/API` 互動。
- 拒絕隱性補齊，向量維度嚴格匹配。

## 規劃描述

1. **專案架構規範與文檔精確校準**：校準 `README.md`、`docs/architecture.md`、`docs/conventions.md` 與 `AGENTS.md` 中關於 2x Grid 座標與 Port 的定義（全偶數錨點、恰 1 偶數端口）。
2. **核心斷言與工具函式實作**：於 `src/utils/device_utils.ts` 實作 `is_valid_port_position`（恰 1 偶數）、`is_valid_device_position`（全偶數錨點）與 `get_port_axis`。
3. **入庫生命週期與指令驗證**：確保 `cmd_executor.ts` 與 `device_card.ts` 驗證輸入為全偶數座標。
4. **渲染器與 UI 層適配**：適配 `draw_device.ts`、`base_test_device.ts` 與 `layer_selector.ts`（樓層 $Z=0, 2, 4$）。

## 觀察與推論

### O1 · 2026-08-22 02:26:00+08:00 — 2x Grid 幾何不變量與邊界端口特性
在 2x Grid 系統中，裝置錨點必然為全偶數 $(2i, 2j, 2k)$，端口必然位在相鄰格子的交界面上（恰好 1 個偶數座標，其餘為奇數）。若未在進入核心前進行嚴格斷言，不合規的 mod 或使用者輸入可能破壞圖連通性與空間切面分片。

### O2 · 2026-08-22 03:00:00+08:00 — 規範確立：Position 恆為全偶數 $(2\mathbb{Z})^n$ 錨點
確認專案標準核心幾何格式為 $\text{position} \in (2\mathbb{Z})^n$（全偶數網格錨點），邊界端口為 $\text{port} \in \{x \in \mathbb{Z}^n : \text{恰 1 偶數，} n-1 \text{ 奇數}\}$。

## 待辦

### 1 實作裝置與端口座標奇偶性校驗斷言（Parity Validation）與 position=2Z^n 規範校準
- **state:** 完成
- **basis:** → O1, O2

全面落實全偶數網格錨點座標與恰 1 偶數邊界端口幾何體系：同步文檔規範、Parity 斷言工具函式、CMD 指令偶數座標驗證、UI Layer 選擇器與渲染器。

**沿革**

- H1 · 2026-08-22 02:30 決斷 —— 開立獨立計畫建立端口奇偶性校驗機制（使用者）
- H2 · 2026-08-22 03:00 決斷 —— 確認採用 position $\in (2\mathbb{Z})^n$ 全偶數錨點與恰 1 偶數端口體系（使用者）
- H3 · 2026-08-22 03:02 落地 —— 完成文檔規範、Parity 工具函式、CMD 與 UI 驗證、2.5D 切片與渲染器校準（Agent）
- H4 · 2026-08-22 03:06 修正 —— 移除專用 `is_vertical_port` 函式，統一由 `get_port_axis` 泛型處理維度方向（使用者指示）
