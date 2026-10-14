---
name: plan-history
description: plan-history v4 工具的抽象結構（資料模型、處理流程、一致性規則、查詢介面）。參考實作已移除，本檔保留其設計，供重新實作或遷移時對照。
---

# plan-history v4 — 抽象結構

計畫檔的格式規則見 [readme.md](readme.md)。本檔只描述**工具**：它怎麼讀計畫、檢查什麼、產出什麼。

參考實作（Python，僅標準函式庫）已從本目錄移除，最後版本在 commit `505a66c`：
`docs/history/plan_parse.py`、`update-head.py`、`plan-item.py`，以及其產物 `head.md`。

## 一、架構

### 1. 分層

```text
parser library   (single source of truth for "how a plan is read")
├── data model   Observation / HistoryEntry / Item / Plan / Conflict / Report
├── parsing      parse_plan → parse_observations, parse_items
├── checking     check (cross-file rules)
├── derivation   item_index, blockers, display_state, claimed_by, cycles
└── formatting   format_conflicts

head renderer    (CLI: render head.md + report conflicts + PostToolUse hook)
item query       (CLI: read-only view of one item / list open items)
```

兩支 CLI 只依賴 parser library，彼此不依賴。

### 2. 資料流

```text
collect(dir)
  → glob dir/*.md (first level only; skip head.md / readme.md / README.md)
  → parse_plan(path)            per-file: filename, header, sections, O, items, local refs
  → check(plans)                cross-file: seq, prev, needs/移交, cycles, size warnings
  → Report{plans, conflicts}
       ├─ head renderer → head.md (pure function of plan files, idempotent)
       └─ item query    → stdout
```

### 3. 資料模型

| 型別 | 欄位 |
| --- | --- |
| `Plan` | `seq`、`date`、`topic`、`title`、`status`、`prev`、`skill`、`has_reason`、`summary`、`observations{n→O}`、`items[]`、`obs_refs`、`addr_refs` |
| `Item` | `addr = <seq>#<num>`、`title`、`state`、`needs[]`、`handoff[]`（移交）、`basis[]`、`body[]`、`history[]` |
| `Observation` | `num`、`stamp`、`heading`、`lines` |
| `HistoryEntry` | `num`、`date`、`kind`、`text`、`obs_refs` |
| `Conflict` | `code`、`plan`、`detail`、`severity`（conflict / warning） |
| `Report` | `plans`、`conflicts`；`errors` = 非警告者 |

### 4. 只存單向，其餘推導

| 推導值 | 來源 |
| --- | --- |
| 阻塞 | `needs` 中尚未到終態的格子 |
| 承接自 | `移交` 的反向 |
| HEAD | in-progress → draft → done，取第一個非空分類中序號最大者 |
| 待辦剩 x/y、已移交 n | 各格 state |

### 5. 設定點

- 文法：檔名、檔頭欄位、觀察標題、格子標題、欄位行、沿革行、位址 `<seq>#<n>`、觀察引用 `→ O<n>`。
- 詞彙：status 5 種、state 5 種（終態 3 種）、沿革種類 8 種。
- 門檻：正文 15 行、basis 3 條、沿革 8 條、改題 2 次、主題簡述 20 行。
- 環境變數 `PLAN_HISTORY_ROOT`：把工具指向 fixture 目錄。
- 顯示根：往上找 `.git`，訊息中的路徑以 repo 相對路徑呈現。

## 二、功能

### A. 解析

- 檔名 `<seq>_<YYYYMMDDHHMM>_<topic>.md`；`# 標題` 必須等於檔名；`status`、`prev`（取反引號內的檔名）、`skill` 必須為 `plan-history v4`。
- 各節：`## 主題簡述`、`## 捨棄原因`（是否非空）、`## 觀察與推論`、`## 待辦`。
- 觀察：標題格式、編號不重複、時間戳由舊到新。
- 格子：`### <n> 標題`、欄位（`state` / `needs` / `移交` / `basis`）、正文、`**沿革**` 之後的 `H<n>` 行。
- 全檔收集 `<seq>#<n>` 與 `→ O<n>` 引用。

### B. 一致性檢查

| 階段 | 代碼 |
| --- | --- |
| 單檔 | `BAD_FORMAT`、`BAD_ITEM_FORMAT`、`OBS_OUT_OF_ORDER`、`BROKEN_OBS_REF` |
| 跨檔 | `DUPLICATE_SEQ`、`DONE_WITH_OPEN_ITEMS`、`MISSING_REASON`、`SUPERSEDED_WITHOUT_SUCCESSOR`、`BROKEN_PREV`、`DANGLING_REF`、`CYCLIC_NEEDS` |
| 警告 | `HEADER_TOO_LONG`、`OVERGROWN`（一格觸發 ≥ 2 個過大訊號） |

警告只印出，不影響結束碼。

### C. head renderer

- 產生 `head.md`：目前使用中、逐格列出開著的格子、draft / in-progress 清單、衝突提示。
- 模式：預設（寫檔並報告）、`--check`（不寫檔）、`--hook`（從 stdin 讀 PostToolUse JSON，只在動到計畫 `.md` 時執行）。
- 結束碼：0 乾淨 · 1 有衝突 · 2 有衝突（`--hook`，讓 agent 看到 stderr）。

### D. item query

- `<seq>#<n>`：這一格、計畫檔頭（主題簡述）、basis 觀察；沿革只顯示條數。
- `--history`：另加全部沿革與沿革引用的觀察。
- `--list`：所有 live 計畫的開放格，寬字元對齊，阻塞者標示等待對象。
- 結束碼：0 正常 · 2 位址錯誤／找不到。
