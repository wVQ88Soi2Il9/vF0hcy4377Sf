# 0044_202608240318_integrate-docs-into-agents-md

- **status:** done
- **prev:** ./0043_202608232315_modify-history-tree.md
- **skill:** plan-history v3

## 主題簡述

將 `docs/architecture.md` 與 `docs/conventions.md` 之核心架構、技術規範與設計原則全面整合至根目錄的 `AGENTS.md`，清理已過時的歷史遺留描述（如 `device_definition` 靜態藍圖、`draw_registry`、舊版 `rotate` 指令與舊 CLI 別名），並將 `docs/` 文件同步清理或重構為統一的規範單一真實來源（Single Source of Truth）。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，維護 `@/API` 邊界隔離。
- 拒絕隱性補齊（No Implicit Zero-Padding），維持資料純淨假設。
- 整合後之 `AGENTS.md` 必須清晰、完備且無衝突，移除所有過時資訊。

## 規劃描述

1. **盤點與提取文檔核心內容**：從 `docs/architecture.md` 與 `docs/conventions.md` 提取有效架構圖、2× 網格座標體系、能力介面、Rely-Pack 機制、程式碼風格與技術棧。
2. **清理過時資訊**：剔除已廢棄的靜態 `devices.json` 藍圖、`device_definition`、`draw_registry` 查表、`rotate` 舊指令、舊命令列別名等。
3. **整合至 `AGENTS.md`**：將架構規範、程式碼規範、網格幾何、OOP 能力介面、Pack 規則與 Plan History 強制流程彙編成單一完備指引。
4. **同步整理 `docs/` 目錄**：修訂或精簡 `docs/architecture.md` 與 `docs/conventions.md` 使其與 `AGENTS.md` 保持完全一致，移除過時內容。
5. **執行 `update-head.py`**：同步更新 `docs/history/head.md`。

## 觀察與推論

### O1 · 2026-08-24 03:18:00+08:00 — 文檔分散與歷史過時內容盤點
原先 `AGENTS.md` 指向 `docs/conventions.md` 與 `docs/architecture.md`，然而這兩份文檔內部仍殘留 OOP 轉型前的舊規格（例如 Rule 2 的 `data/devices.json`、`device_definition`，以及過時的 `draw_registry`、`rotate` 指令等）。將其整合並淨化後，Agent 與開發者只需閱讀 `AGENTS.md` 即可獲取 100% 準確且最新的開發準則。

## 待辦

### 1 整合 docs/architecture.md 與 docs/conventions.md 至 AGENTS.md 並清除過時資訊
- **state:** 完成
- **basis:** → O1

將兩份文檔的核心規格、架構圖、座標系統與程式碼風格整合至 `AGENTS.md`，移除已廢棄之靜態裝置定義與舊版指令描述。

**沿革**

- H1 · 2026-08-24 03:18 決斷 —— 確立整合架構與規範文檔至 AGENTS.md（使用者）
- H2 · 2026-08-24 03:19 落地 —— 完成 AGENTS.md 整合編寫，建立三層架構、2x 網格、OOP 能力介面、Pack 載入與風格總綱（Agent） → O1

### 2 同步修訂 docs/ 目錄文檔與執行 update-head.py
- **state:** 完成
- **basis:** → O1

確保 `docs/architecture.md` 與 `docs/conventions.md` 同步更新或精簡對齊，並執行 `python docs/history/update-head.py`。

**沿革**

- H1 · 2026-08-24 03:18 決斷 —— 確立修訂 docs/ 內部文檔消除過時內容並更新 head.md（使用者）
- H2 · 2026-08-24 03:19 落地 —— 更新 docs/architecture.md 與 docs/conventions.md 並成功執行 update-head.py（Agent） → O1
