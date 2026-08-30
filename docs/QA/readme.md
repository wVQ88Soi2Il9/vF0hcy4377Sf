# QA 紀錄規範 (Question & Answer Records)

本目錄專門用來留存開發過程中針對架構設計、核心疑問、需求澄清與決策共識的問答紀錄，方便日後查閱。

---

## 1. 檔案命名格式

```
docs/QA/<number>-<yymmddhhmm>_<topic>.md
```

- `<number>`：4 位序號（如 `0001`）
- `<yymmddhhmm>`：10 位時間戳記（台北時間 Asia/Taipei，2 位年份 + 月日十分）
- `<topic>`：簡短英文主題名稱（kebab-case）

**範例**：`docs/QA/0001-2608250130_core-vs-api-wrapper.md`

---

## 2. 檔案樣板 (Template)

```markdown
# <number>-<yymmddhhmm>_<topic>

- **status:** resolved  <!-- open | resolved | archived -->
- **topic:** <討論主題說明>

## 提問與回答

### Q1 · YYYY-MM-DD HH:MM（使用者）
<使用者提出的問題或需求描述>

### A1 · YYYY-MM-DD HH:MM（agent: <model_name>）
<Agent 的技術回覆、架構分析與方案提供>

## 結論
<最終達成的共識與決策摘要>
```

---

## 3. 身分標註原則 (Multi-collaborator Identity)

- **使用者 / 人類**：多人協作時優先讀取本地 `git config user.name` 標記為 `（human: <git_user_name>）`（例：`（human: alice）`、`（human: bob）`）；亦相容通用 `（human）` 或 `（使用者）`。
- **Agent**：強制標註使用的模型名稱與強度，例如 `（agent: gemini-3.7-flash）`、`（agent: sonnet-3.7）`。