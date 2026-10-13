# 0048_202608241716_history-human-agent-roles-and-qa

- **status:** in-progress
- **prev:** ./0047_202608240341_optimize-shirones-ui.md
- **skill:** plan-history v3

## 主題簡述

改進 Plan History 系統與管理工具（規範、解析器與檢查腳本），明確劃分 Human 與 Agent 之權責邊界，並新增「提問」與「回答」機制。
明定 `[完成, 否決]` 僅由 Human 主動判定與設定，Agent 無權標記；新增 `[提問, 回答]` 供雙方溝通交流，且強制標註行為者身分（Agent 須附帶模型與強度標記）。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 嚴格遵循單向三層架構與邊界隔離。
- 確保所有現有 Plan 文件（v1, v2, v3）能相容解析無誤。
- 拒絕隱性補齊。

## 規劃描述

1. **更新規範文檔**：
   - 更新 `AGENTS.md`：明定 Human 專屬權限（`完成`、`否決`）與 Agent 權限限制；規範 `提問` 與 `回答` 格式，強制 Agent 標註模型/強度。
   - 更新 `docs/history/readme.md`：在 v3 待辦與沿革規範中詳細定義 `提問` / `回答` 之語法、身分標籤格式（如 `（agent: <model>）` 與 `（human）`），以及 Human 專屬終端狀態規則。
2. **升級解析與驗證工具 (`plan_parse.py`)**：
   - 在 `HIST_KINDS` 新增 `"提問"` 與 `"回答"`。
   - 增加身分標籤驗證規則：檢查 `提問` 與 `回答` 條目是否帶有合規的身分標記；若為 Agent 提問/回答，檢查是否附帶模型名稱；若缺少標籤則回報 `BAD_ITEM_FORMAT`。
3. **驗證與同步**：
   - 執行 `update-head.py` 驗證全庫文件無衝突。
   - 測試正常與異常標籤案例以確保防呆校驗生效。

## 觀察與推論

### O1 · 2026-08-24 17:16:00+08:00 — 角色邊界與互動記錄需求
原先 Plan 系統中，`state: 完成` 與 `state: 否決` 雖有隱含角色含義，但 Agent 可能擅自將任務標記為完成；且在開發過程中遇到需求疑問或決策澄清時，缺乏標準化的「提問/回答」沿革記錄與行為者（特別是 Agent 具體模型名稱與強度）標記機制，導致決策脈絡難以精確追溯。

## 待辦

### 1 更新 AGENTS.md 與 docs/history/readme.md 規範
- **state:** 完成
- **basis:** → O1

修訂專案開發規範與 Plan History 文件，明確劃分 Human/Agent 權限、限制完成/否決之設定權限，並完整定義提問與回答之格式及身分標記（Agent 須附帶模型與強度）。

**沿革**

- H1 · 2026-08-24 17:16 決斷 —— 建立 Human/Agent 權限劃分與提問/回答計畫（使用者）
- H2 · 2026-08-24 17:17 落地 —— 完成 AGENTS.md 與 readme.md 規範更新 → O1

### 2 更新 plan_parse.py 解析與防呆驗證
- **state:** 完成
- **basis:** → O1

在 `plan_parse.py` 中將 `提問` 與 `回答` 納入 `HIST_KINDS`，並實作身分標記檢查邏輯（支援全形/半形括號、Human 標記與 Agent 模型強度標記），若格式不符發出 `BAD_ITEM_FORMAT`。

**沿革**

- H1 · 2026-08-24 17:16 決斷 —— 建立 Human/Agent 權限劃分與提問/回答計畫（使用者）
- H2 · 2026-08-24 17:17 落地 —— 完成 plan_parse.py HIST_KINDS 與 ACTOR_TAG_RE 防呆驗證 → O1

### 3 驗證全庫解析與身分標記測試
- **state:** 完成
- **basis:** → O1

執行 `update-head.py` 與 `plan-item.py`，進行邊界條件與格式錯誤防呆測試，確保全庫無報錯且正確運作。

**沿革**

- H1 · 2026-08-24 17:16 決斷 —— 建立 Human/Agent 權限劃分與提問/回答計畫（使用者）
- H2 · 2026-08-24 17:18 落地 —— 執行 update-head.py 與 plan-item.py 驗證無報錯 → O1
