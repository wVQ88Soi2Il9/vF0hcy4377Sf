---
name: plan-history
description: docs/history/ 計畫紀錄的結構規格——檔案格式、資料模型、不變式、推導值、一致性檢查與工具介面。
---

# plan-history — 結構規格

## 一、目錄與檔案

```text
docs/history/
├── skill.md                                本規格（非計畫檔）
├── <index file>                            索引，由索引產生器輸出，非計畫檔
└── <seq>_<YYYYMMDDHHMM>_<topic>.md         計畫檔，一份計畫一個
```

- 只處理目錄第一層的 `*.md`；非計畫檔以固定名單排除。
- 檔名文法：`^(\d{4})_(\d{12})_([a-z0-9][a-z0-9-]*)\.md$`
  - `<seq>`：4 位數，全域遞增，不重用。
  - `<YYYYMMDDHHMM>`：建立時間，台北時間。
  - `<topic>`：小寫 ASCII kebab-case，2–5 個詞。

## 二、計畫檔結構

```markdown
# <seq>_<YYYYMMDDHHMM>_<topic>

- **status:** <status>
- **prev:** `./<plan filename>` | —
- **skill:** <skill id>

## 捨棄原因

## 主題簡述

## 觀察與推論

### O<n> · YYYY-MM-DD HH:MM:SS+08:00 — <標題>

<內文>

## 待辦

### <n> <標題>

- **state:** <state>
- **needs:** <seq>#<n>、…
- **移交:** <seq>#<n>、…
- **basis:** → O<n>、…

<正文>

**沿革**

- H<n> · YYYY-MM-DD HH:MM <種類> —— <一行> [→ O<n>]
```

- 節名與欄位名固定，是解析的錨點。
- `## 捨棄原因` 只在 status 為 `superseded` / `abandoned` 時存在。
- `## 主題簡述`：計畫存在的原因，以及約束所有格子的條件。
- 格子欄位中，`state` 必填，其餘選填。
- 格子內 `**沿革**` 之後的非空行都必須是沿革行。

## 三、資料模型

| 實體 | 識別 | 欄位 |
| --- | --- | --- |
| Plan | `<seq>` | `date`、`topic`、`title`、`status`、`prev`、`skill`、`has_reason`、`summary`、`observations{n→O}`、`items[]`、`obs_refs`、`addr_refs` |
| Observation | `O<n>`（計畫內） | `stamp`、`heading`、`lines` |
| Item | `<seq>#<n>`（全域位址） | `title`、`state`、`needs[]`、`handoff[]`、`basis[]`、`body[]`、`history[]` |
| HistoryEntry | `H<n>`（格子內） | `date`、`kind`、`text`、`obs_refs[]` |
| Conflict | — | `code`、`plan`、`detail`、`severity`（conflict / warning） |
| Report | — | `plans[]`、`conflicts[]`；`errors` = severity 非 warning 者 |

### 詞彙

| 項目 | 值 |
| --- | --- |
| status | `draft`、`in-progress`、`done`、`superseded`、`abandoned` |
| live status | `draft`、`in-progress` |
| closed status | `superseded`、`abandoned` |
| state | `待實作`、`等待確認`、`完成`、`否決`、`移交` |
| 終態 state | `完成`、`否決`、`移交` |
| 沿革種類 | `決斷`、`落地`、`修正`、`否決`、`拆格`、`合併`、`改題`、`移交` |

### 引用文法

| 引用 | 文法 | 範圍 |
| --- | --- | --- |
| 格子位址 | `\b(\d{4})#(\d+)\b` | 全域；跨計畫一律用全位址 |
| 觀察引用 | `→\s*O(\d+)` | 同一份計畫 |
| basis | 欄位值中的 `O(\d+)` | 同一份計畫 |
| prev | 反引號內的檔名，或 `—` | 同一目錄 |

## 四、不變式

1. `<seq>` 全域唯一；`O<n>` 在計畫內唯一，`<n>` 在計畫內唯一，`H<n>` 在格子內唯一，都不重用。
2. `# 標題` 等於檔名去掉 `.md`。
3. `skill` 欄位值固定。
4. 觀察只追加：時間戳依序不遞減，必須帶 `+08:00`。互相矛盾的觀察以時間較晚者為準。
5. 正文表示目前狀態，可以重寫。沿革只追加。
6. 格子不刪除，以終態結束。
7. `needs` 與 `移交` 只存單向，反向關係由推導取得。
8. `basis` 只列目前的依據。
9. `state = 移交` 若且唯若 `移交` 欄位非空；`移交` 不得指向自己。
10. `status ∈ closed` ⇒ `## 捨棄原因` 非空。
11. `status = superseded` ⇒ 至少一份計畫的 `prev` 指向它。
12. `status = done` ⇒ 所有格子都處於終態。
13. `needs` 圖無環。
14. 所有引用都必須能解析到既存目標。

## 五、推導值

不存、只算：

| 推導值 | 定義 |
| --- | --- |
| 阻塞 | 格子未到終態，且其 `needs` 中有未到終態的目標；顯示時取代 state |
| 承接自 | 以 `移交` 指向本格的格子集合 |
| HEAD | 依 `in-progress` → `draft` → `done` 的順序，取第一個非空分類中 seq 最大的計畫 |
| 開放格 | 非終態的格子 |
| 待辦剩 x/y | 開放格數／格子總數 |
| 已移交 n | `state = 移交` 的格子數 |

## 六、一致性檢查

| 代碼 | 階段 | 嚴重度 | 條件 |
| --- | --- | --- | --- |
| `BAD_FORMAT` | 單檔 | conflict | 檔名、標題、status、prev、skill、必要節、觀察標題不合文法；觀察編號重複；缺觀察或缺格子 |
| `BAD_ITEM_FORMAT` | 單檔／跨檔 | conflict | 格子標題不合文法、編號重複、缺 state、state 或沿革種類不在詞彙內、沿革行格式錯誤、`H<n>` 重複、違反不變式 9 |
| `OBS_OUT_OF_ORDER` | 單檔 | conflict | 違反不變式 4 |
| `BROKEN_OBS_REF` | 單檔 | conflict | `→ O<n>` 或 basis 指向未定義的觀察 |
| `DUPLICATE_SEQ` | 跨檔 | conflict | 兩份計畫的 seq 相同 |
| `DONE_WITH_OPEN_ITEMS` | 跨檔 | conflict | 違反不變式 12 |
| `MISSING_REASON` | 跨檔 | conflict | 違反不變式 10 |
| `SUPERSEDED_WITHOUT_SUCCESSOR` | 跨檔 | conflict | 違反不變式 11 |
| `BROKEN_PREV` | 跨檔 | conflict | prev 指向不存在的檔案或自己 |
| `DANGLING_REF` | 跨檔 | conflict | `needs`、`移交` 或內文中的 `<seq>#<n>` 無法解析 |
| `CYCLIC_NEEDS` | 跨檔 | conflict | 違反不變式 13 |
| `HEADER_TOO_LONG` | 跨檔 | warning | `## 主題簡述` 的非空行數 > 20 |
| `OVERGROWN` | 跨檔 | warning | 一格同時觸發 ≥ 2 個訊號：正文非空行 > 15、basis > 3、沿革 ≥ 8、改題 ≥ 2 |

warning 不影響結束碼。

## 七、架構

```text
parser library   (single definition of how a plan is read)
├── data model   Plan / Observation / Item / HistoryEntry / Conflict / Report
├── parsing      parse_plan → parse_observations, parse_items
├── checking     check (cross-file rules)
├── derivation   item_index, blockers, display_state, claimed_by, cycles
└── formatting   format_conflicts

index generator  (writes the index file, reports conflicts)
item query       (read-only view of one item / list of open items)
```

兩個介面都只依賴 parser library，彼此之間不依賴。

```text
collect(dir)
  → glob dir/*.md (first level; skip non-plan files)
  → parse_plan(path)    per file
  → check(plans)        cross file
  → Report{plans, conflicts}
       ├─ index generator → index file
       └─ item query      → stdout
```

設定點：

- 計畫根目錄：可以用環境變數覆寫，供測試使用。
- 顯示路徑：以 repo 根目錄的相對路徑呈現。

## 八、介面

### 索引產生器

- 輸出是計畫檔的純函式，不含時間戳；輸入不變時，重跑不產生差異。
- 內容依序為：HEAD（含待辦剩 x/y）、所有 live 計畫的開放格（`位址 · 顯示 state — 標題`，阻塞者標示等待對象）、live 計畫清單（seq 降序），以及有衝突時的提示。

| 模式 | 行為 | 結束碼 |
| --- | --- | --- |
| 預設 | 寫入索引並印出報告 | 0 乾淨 · 1 有 conflict |
| check | 不寫索引，只報告 | 同上 |
| hook | 從 stdin 讀工具事件；只在事件寫入計畫檔時執行，報告輸出到 stderr | 0 乾淨 · 2 有 conflict |

### 單格查詢

| 輸入 | 輸出 | 結束碼 |
| --- | --- | --- |
| `<seq>#<n>` | 格子標題、計畫 status、主題簡述、格子欄位（含推導出的阻塞與承接）、正文、basis 觀察、沿革條數 | 0 |
| `<seq>#<n>` + history | 上述內容，加上全部沿革，以及 basis 和沿革引用到的所有觀察 | 0 |
| list | 所有 live 計畫的開放格，依 seq 降序；寬字元對齊 | 0 |
| 位址不合文法、找不到計畫或格子 | 錯誤訊息輸出到 stderr | 2 |
