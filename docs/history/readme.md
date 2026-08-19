---
name: plan-history
description: Record and maintain this repo's plan history under your own plan root (see 計畫根目錄 in the skill body). Use BEFORE starting any non-trivial development, refactor, bug fix, or content change — write the plan file first, then implement. Also use when the user asks for a plan / 規劃 / 計畫 / 方案 document, when continuing or forking from an earlier plan ("接續那份計畫", "基於 XXX 往下走", "回到前一個計畫", "換個方向"), and when updating a plan's status or checklist after work lands.
---

# Plan history

**版本：v3**

## 計畫根目錄

本文所有 `<PLAN_ROOT>` 都指專案的計畫目錄：

```
<PLAN_ROOT> = docs/history
```

三支 `.py` 以自身所在目錄為 corpus root（`PLAN_HISTORY_ROOT` 未設時），因此它們與 `<PLAN_ROOT>` 位於同一目錄。`head.md` 是由腳本自動生成的單一匯總檔，嚴禁手動編輯。

Every planned change to this repo leaves a trace in `<PLAN_ROOT>/`: one flat
directory, one `.md` per plan, chained through a `prev` pointer so a direction change
is a new file that names its ancestor rather than an edit that erases it.

Three kinds of content live in a plan, and they are kept apart because their time
semantics differ:

- **觀察** — a fact, stamped with the moment it was taken. Append-only. It starts
  rotting the moment it is written, and that is fine: it is dated, and the judgement
  made on it stays true forever.
- **待辦的正文** — what is owed *right now*. Rewritable; rewriting it is not lying.
- **待辦的沿革** — how this item got to be the way it is. Append-only.

Collapse any two of those into one container and the file grows without bound: facts
start masquerading as unfinished work, or the current state has to be reconstructed by
reading a stack of edits in chronological order.

Four mechanical pieces live alongside the plans:

- **`head.md`** — the entry point: which plan is current, and every open item.
  **Generated. Never hand-edit it** — read it, and let the script write it.
- **`update-head.py`** — regenerates `head.md` and reports conflicts.
- **`plan-item.py`** — returns **one item** instead of a whole plan. See below.
- **`plan_parse.py`** — the single definition of how a plan file is read, shared by both
  CLIs so they cannot disagree about what a plan says.

## 版本與不溯及既往

The rules in this file are versioned, because how we work changes over time. **Every
plan declares the version it was written under**, in a `- **skill:**` header line:

```markdown
- **skill:** plan-history v3
```

**A plan with no `skill:` line is v1.** Read and maintain each plan by the rules of the
version it declares. **Never retrofit an older plan to a newer version's format** — a
v1 plan that still reads correctly under v1 is not broken, and rewriting it destroys
the record of how we worked then. Only a new plan file starts at the current version.

| version | what it added |
| --- | --- |
| v1 | flat directory, `prev` chain, `status`, checklist, `head.md` + `update-head.py`. No `skill:` line, no observation section, no handoff section. |
| v2 | `- **skill:**` header line · `## 觀察與推論`（timestamped observations, cited by checklist items）· `## 已移交`（an item handed to another plan, naming the target）· the rule that mid-implementation findings go to the observation section rather than becoming new checklist items. |
| v3 | observation timestamps carry `+08:00` (Taipei) · `推翻` splits into `更正` / `推翻` / `更新` · `## 待辦` replaces the checkbox list: every item is a numbered block with an enumerated `state`, a `needs` dependency graph, a `basis` citation, a rewritable 正文 and an append-only 沿革. `## 已移交` retires — handoff becomes a state plus a two-way pointer. Item ids are plain integers, addressed across plans as `<seq>#<n>`. |

Version-specific checks apply only to plans that declare that version. **The rules for
reading v1 / v2 plans are preserved verbatim at the end of this file** — they are not
history, they are still in force for those files.

## When to use

**Create a plan file before touching code** whenever the user asks for development,
refactoring, a bug fix, a doc restructure, or any change that will take more than a
couple of edits. Write the file, show the user the plan, then implement.

**Create a plan file on request** when the user asks for a plan/規劃/計畫 document,
even if no implementation follows immediately.

**Update the existing plan file** when work lands, an open question gets decided, or
the direction is dropped.

Skip the plan file only for: answering questions, read-only investigation, and
single-spot mechanical edits the user has already fully specified (typo, rename one
symbol, bump one version). When in doubt, write the file — it is cheap.

## Filename
 
```
<PLAN_ROOT>/<seq>_<YYYYMMDDHHMM>_<topic>.md
```

- `<seq>` — 4-digit zero-padded, globally increasing, never reused. Allocate the next
  one by looking at what exists:
  ```bash
  ls <PLAN_ROOT>/[0-9]*.md 2>/dev/null | tail -1
  ```
- `<YYYYMMDDHHMM>` — 12-digit creation timestamp (to the minute). Get it from:
  ```bash
  TZ='Asia/Taipei' date +'%Y%m%d%H%M'
  ```
- `<topic>` — short lowercase ASCII kebab-case, 2–5 words (`dv-status-rollup`,
  `ot-regmap-systemrdl`). Not a sentence.

The sequence number is global, not per-branch: two plans may share the same `prev`
(a fork), and their numbers still differ.

## File template (v3)

```markdown
# <seq>_<YYYYMMDDHHMM>_<topic>

- **status:** draft
- **prev:** `./<seq>_<YYYYMMDDHHMM>_<topic>.md`
- **skill:** plan-history v3

## 捨棄原因

（只在 status 為 superseded / abandoned 時才有這段；其餘情況整段拿掉。）
為什麼停下來，以及接手的是哪一份計畫。

## 主題簡述

問題描述、目標描述、為什麼現在要做這件事。最後列出 plan 級約束（見下）。

## 規劃描述

要怎麼做 — 步驟、影響到的檔案/模組、取捨與理由。

## 觀察與推論

### O1 · YYYY-MM-DD HH:MM:SS+08:00 — 短標題

事實描述：量到什麼、在哪一份輸入上、指向哪些檔案行號。

接著是推論：這個事實意味著什麼、為什麼。

## 待辦

### 1 短標題

- **state:** 待決斷
- **basis:** → O1

正文：這一格現在的完整內容。

**沿革**

- H1 · YYYY-MM-DD HH:MM 決斷 —— 決定了什麼（使用者）
```

The H1 must match the filename exactly (minus `.md`). Heading text is fixed — keep the
section names verbatim, `plan_parse.py` parses them. Body language follows the
conversation; the user writes Chinese, so default to Chinese prose unless the content
is inherently English (code, paths, tool names).

## `## 主題簡述` — the header, and where plan-level constraints live

`## 主題簡述` is the **only** section a per-item reader is shown alongside the item it
asked for. So it carries two things and nothing else: why this plan exists, and the
constraints that bind every item in it.

```markdown
**本計畫的約束**

- 結論落地前不把 traceability loop 掃到其餘 34 個 IP。
```

- **A constraint that belongs to one item is not written here** — it is part of that
  item's 正文, and it travels with the item when the item is handed off. A constraint
  is never a 待辦 and never a `state`; it is prose attached to whatever it constrains.
- **Hard cap ~20 lines**, over that is a warning. This section is the one place with
  a standing incentive to accumulate, because everything is "important context". It is
  not a summary of the plan — `## 規劃描述` is.

## `## 觀察與推論`

**Changed in v3 only in the timestamp and the relation words below.** This is where
everything you find while implementing goes. A
finding is a fact about a moment in time; it is not a task. Writing it as a 待辦 is
what makes plans grow without end — the work is finite, the digesting is not.

```markdown
### O3 · 2026-08-07 15:04:12+08:00 — repair 改寫後沒重驗

- **推翻:** O1

事實描述（量到什麼、在哪份輸入上、指向哪些檔案行號）。

接著是推論：這個事實意味著什麼、為什麼。
```

- **`O<n>`** — increments within one plan file, never reused. The number exists so a
  待辦 can point at the observation; a Chinese heading has no stable anchor.
- **Timestamp** — Taipei time, with the offset written out. Never from memory:

  ```bash
  TZ='Asia/Taipei' date +'%Y-%m-%d %H:%M:%S+08:00'
  ```

  **The offset is required from v3 on**, and a v3 observation without one is reported.
  A bare stamp does not say which clock it was read from, and this repo's machines run
  UTC while its reader does not — eight hours of drift that the record cannot detect.
  Observations are appended oldest to newest, so the moments only increase down the
  file; ordering compares **instants**, so a file may hold both forms and still sort
  correctly.
- **When two observations in one plan contradict each other, the later timestamp
  wins.** That is the whole reason for stamping them.
- **A relation never edits the observation it points at.** O1 was true when it was
  taken; the timestamps say so on their own. Never rewrite or delete an earlier
  observation — one that later turned out to be wrong is still a real record of what
  we believed.

### 三種關係 — say which one

Through v2 a single `推翻:` carried all three of these, and they ask the reader for
opposite things. Name the right one:

| relation | what it says | what the reader must do |
| --- | --- | --- |
| `- **更正:** O1` | **O1's fact is wrong** — mis-measured, wrong input, misread output | stop citing O1, and re-examine everything already built on it |
| `- **推翻:** O1` | O1's fact stands; the **inference** drawn from it does not | re-check the conclusions, keep the number |
| `- **更新:** O1` | O1 was true then and is not now — the tree moved, the run was redone | nothing; both are true, each for its own moment |

- **`更新` is the common one.** Every re-run produces it. Calling that "推翻" is what
  drains the word of force, and 推翻 has to keep its force for the day it matters.
- **`更正` is the only one with a machine consequence.** Any 待辦 whose `basis` still
  points at a 更正'd observation is reported (`STALE_BASIS`) — the item is arguing from
  a number we have disavowed. 沿革 is **not** checked: a past entry citing an
  observation that was later corrected is a true record of what we believed then.

An observation may cite a report or a commit, but it is not a report: keep the
inventories, tables and full audits in `docs/analysis/` or `docs/reports/` and
reference them from here.

## `## 待辦`

One item is one `### <n> 標題` block. **`<n>` is a plain integer**, increasing within
the plan, never reused — no `I` / `B` / `C` prefixes, no `(a)(b)(c)` sub-items, no
`14-I2`. Grouping by theme goes in prose, not in the id.

```markdown
### 14 讓消融說得出成因

- **state:** 待實作
- **needs:** 0007#12
- **basis:** → O51、O30、O15

一次消融跑完之後,「有沒有產生 UVM report」「哪些行是 UVM_ERROR」「是哪個 step 失敗的」
三件事在事後都查得出來。留存的是判決依據,不是現場。

**沿革**

- H1 · 2026-08-09 決斷 —— 留存判決依據而不是完整 stdout（使用者）
- H2 · 2026-08-09 落地 —— `judge()` 回 `(verdicts, basis)` → O52
- H3 · 2026-08-09 修正 —— 成因假說在唯一實例上被排除，正文改寫 → O51（取代 H1）
```

### 位址：一律寫全 `<seq>#<n>`

Reference an item as `0007#14` **everywhere, including inside the same plan and inside
prose**. One uniform form means a single regex validates every reference wherever it
appears — and today's prose references (`0008 A5 (a)`, `0008 B8`) are exactly the ones
nothing can check. Bare `#14` is not a reference; it will not be resolved.

### `state` — a closed vocabulary

| value | meaning |
| --- | --- |
| `待決斷` | a question is open and **the user owes the answer** |
| `待實作` | decided, not started |
| `實作中` | started, partially landed |
| `完成` | done |
| `否決` | decided not to do it — the reason is in 正文 and in a `否決` 沿革 entry |
| `移交` | another item owns it now; `- **移交:**` names which |

- **There is no `owner` field.** It is derivable: `待決斷` is the user's move,
  `待實作` / `實作中` is the agent's.
- **There is no `阻塞` state.** It is computed from `needs`: an item whose prerequisite
  is not in a terminal state is blocked. Storing it would drift the moment a
  prerequisite lands.
- **`實作中` is not optional politeness.** Without it, a half-landed item and an
  untouched one look identical to whoever picks it up next.
- Terminal states are `完成` / `否決` / `移交`.

### `needs` — dependencies, one direction only

```markdown
- **needs:** 0007#12、0010#3
```

`needs` names the items that must reach a terminal state first. It is global — it may
cross plans. `blocks` (who is waiting on me) is **computed and printed**, never
written: one graph, one stored direction.

**There is no free-text blocker field.** If the thing standing in your way is "we need
one more EDA run", that run **is an item** — write it as one. A prose blocker field is
how real work disappears from the denominator.

### `basis` — the current justification

```markdown
- **basis:** → O51、O30、O15
```

Every observation this item currently rests on, and **only** those. When the basis
changes, re-point the arrow; the superseded observation stays where it is, in
`## 觀察與推論`. **Do not write a chain** (`→ O2 → O34 → O35`) — that is history, and
history belongs in 沿革. A tool prints these observations in full next to the item, so
a stale arrow costs the next reader real tokens.

### 正文 — the present, rewritable

The item's **complete current content**: what state it must reach, the judgement
criteria, the approach already decided and why, and any constraint it is subject to.

- It is **not** a diff against what it used to say. A reader who never saw the old
  version must be able to act on it.
- **Rewrite it freely.** Rewriting the present is not lying — the history is in 沿革,
  which is append-only, and the evidence is in the observations, which never change.
- **Soft cap ~15 lines**, over that is a warning. The warning has two honest exits:
  it is really two items, or the detail belongs in an observation.
- **Never restate an observation here.** Cite it. A second copy of a finding is how
  that finding starts drifting, and the copy that gets read is this one.

### 沿革 — the past, append-only

One line per entry, `H<n>` increasing within the item, never reused (`H<n>` is
item-local; `取代 H1` always means this item's H1).

```markdown
- H2 · 2026-08-09 落地 —— `judge()` 回 `(verdicts, basis)` → O52
```

`H<n> · <YYYY-MM-DD> <kind> —— <一行> [→ O<n>] [（來源／取代 H<n>）]`

| kind | when |
| --- | --- |
| `決斷` | a question in this item got answered — name the source: the user, or an observation |
| `落地` | implementation reached the tree → O |
| `修正` | the basis changed and 正文 was rewritten → O; name what it 取代, if anything |
| `否決` | this item, or a named alternative inside it, is rejected |
| `拆格` / `合併` | structure changed; name the other item ids |
| `改題` | records the previous title |
| `移交` | names the target item |

- **Ordering is positional**, not by the date string: entries are appended, so the
  bottom one is the newest. The date is for the reader; the order is the file's.
- **`推翻` is not a 沿革 kind.** It is an observation-to-observation relation and it
  already has a home. An overturned observation shows up here as a `修正` entry that
  cites the new observation. One word, one meaning.
- **A `落地` entry is one line plus `→ O`.** The measurements, the counts and the test
  names live once, in the observation.
- **`取代 H<n>` is a note to the reader, not an instruction to a tool.** It marks the
  older entry in `--history` so nobody acts on it. No view filters on it, so forgetting
  it costs nothing and no check has to pretend it can tell when it was needed.

### 標題

The title is the line `head.md` prints for this item, so its only hard requirement is
that it is **sufficient for routing**: reading it alone must answer "is the thing I am
about to work on this item?". One line, and it must name the *object* (which
mechanism / file / concept), not just the verb.

**Retitling is cheap on purpose.** It costs one `改題` 沿革 entry recording the old
title, and nothing else. Never add friction here: if being honest is expensive, the
record starts lying, and a title that has drifted away from its content breaks routing
for everyone.

**But a retitle is a signal, so ask one question:** 新標題還蓋得住舊標題嗎？

- **蓋得住而且更大** — the new title is more abstract, or joins two things with
  「與」/「以及」 → the item should be **拆格**.
- **蓋不住，對象換了** — the framing was wrong and this is a different thing now →
  **do not retitle**. Close the item (`否決`, or `移交` if someone takes it) and open a
  new one. Retitling here would forge a continuous history for two different objects.
- **比舊的小** — fine, but 沿革 must carry a `落地` or `否決` entry saying where the
  part that left went. Silent shrinkage is how the denominator lies.

### 拆格 = 移交給同一份 plan 的新格

Splitting reuses the handoff machinery; it is not a separate mechanism.

```markdown
### 14 …
- **state:** 移交
- **移交:** 0007#28、0007#29、0007#30

### 28 …
- **承接:** 0007#14
```

- The two-way pointer is checked: a handoff whose target does not point back is
  reported. That is the check that stops an obligation from evaporating between two
  files.
- **Do not copy the parent's 沿革 into the children.** The parent block stays exactly
  where it is, with its full history; children carry `承接:` and start fresh.
- If only part of the item is split out, the parent is **not** `移交` — it stays alive
  and gains `needs: 0007#28`.
- Handing off to another plan is the same thing with a different seq. It works whether
  or not the target plan is the same file.
- **拆格 is proposed by the agent and decided by the user.** It moves ids, changes the
  denominator in `head.md`, and invalidates references. Never do it silently
  mid-implementation.

## `status`

| value | meaning |
| --- | --- |
| `draft` | written, not agreed/started yet |
| `in-progress` | actively being implemented |
| `done` | landed; every item in a terminal state |
| `superseded` | the goal still stands, another plan took it over |
| `abandoned` | dropped; nothing picked the goal up |

**`superseded` vs `abandoned` — one test: does a later plan's `prev` point here and
carry on the same goal?**

- Yes → `superseded`. There is a named successor; write it into `## 捨棄原因`.
- No → `abandoned`. The goal was cancelled, the approach was rejected, or you rolled
  back to an ancestor and this branch is a dead end.

Both closed statuses **require a non-empty `## 捨棄原因`**.

## `prev`

`prev` records **which plan this one continues from**, not chronology.

- First ever plan, or a genuinely unrelated new thread → `- **prev:** —`
- Straight continuation of the most recent plan → point at it.
- Direction change: the new plan's `prev` is the plan being replaced; that older plan
  becomes `superseded` and gets a `## 捨棄原因` naming this file.
- Reverting to an older plan: `prev` is the older plan being resumed, **not** the
  dead-end in between. The dead-end becomes `abandoned` with its own `## 捨棄原因`.

**If you are not certain who the parent is, ask.** Use AskUserQuestion listing the
plausible candidates (the current HEAD from `head.md`, the plan the user last
referenced, "none — new thread"). Do not guess a `prev` to avoid asking — a wrong
chain is worse than a question.

## `head.md` and the tools

`head.md` is generated. For **v3** plans it lists **every open item, one line each**
(`id · state · 標題`), because a per-plan count cannot answer the only question that
matters on arrival: which plan, and which item, owns the thing I was just asked to do.
v1 / v2 plans keep the old per-plan count line. HEAD is the highest-seq `in-progress`
plan; failing that the highest-seq `draft`; failing that the highest-seq `done`.

**Run the script after every create or update:**

```bash
python <PLAN_ROOT>/update-head.py
```

What it reports (lines prefixed `[plan-history]`). **Conflicts fail the exit code;
warnings are printed and do not** — a warning asks for a judgement call, and forcing one
would only teach you to silence it.

| code | meaning | versions |
| --- | --- | --- |
| `DONE_WITH_OPEN_ITEMS` | `done` with items not in a terminal state — finish them or move the status back | all |
| `MISSING_REASON` | `superseded`/`abandoned` without a `## 捨棄原因` | all |
| `SUPERSEDED_WITHOUT_SUCCESSOR` | marked `superseded` but nothing points here — it is `abandoned` | all |
| `BROKEN_PREV` | `prev` names a file that does not exist | all |
| `BAD_FORMAT` | filename, title, status vocabulary, or the item section missing/malformed; on v2+ also a missing `## 觀察與推論` or a malformed observation heading | all |
| `BROKEN_OBS_REF` | a `→ O<n>` or a `更正`/`推翻`/`更新` relation names an observation that does not exist | v2+ |
| `OBS_OUT_OF_ORDER` | observation timestamps do not increase down the file | v2+ |
| `BROKEN_HANDOFF` | a handoff names no target, or names one that does not exist | v2+ |
| `STALE_BASIS` | a 待辦's `basis` still points at an observation whose fact was 更正'd | v3 |
| `BAD_ITEM_FORMAT` | an item has no `state:`, a `state` outside the vocabulary, a malformed `H<n>` line, or a 沿革 kind outside the table | v3 |
| `DANGLING_REF` | a `needs:` / `移交:` / `承接:` / prose `<seq>#<n>` names an item that does not exist | v3 |
| `UNCLAIMED_HANDOFF` | A hands off to B, but B carries no `承接:` pointing back at A | v3 |
| `ORPHAN_CLAIM` | B claims `承接: A`, but A does not hand off to B | v3 |
| `CYCLIC_NEEDS` | the `needs` graph has a cycle | v3 |
| `STARVED` (warning) | plan is `in-progress` but every open item is `待決斷` or blocked by one — nobody can proceed without the user | v3 |
| `OVERGROWN` (warning) | an item trips ≥2 of: 正文 > 15 lines · basis > 3 observations · 沿革 ≥ 8 entries · ≥2 `改題` | v3 |
| `HEADER_TOO_LONG` (warning) | `## 主題簡述` is over 20 lines | v3 |

**Never fix a conflict by weakening the record** — do not move an item to a terminal
state it has not reached, do not delete an item to make `done` pass, and do not edit or
drop an observation to silence `OBS_OUT_OF_ORDER`. Fix the underlying state, or tell
the user about the conflict and let them decide.

## 讀一格，不要讀整份

```bash
python <PLAN_ROOT>/plan-item.py 0011#5             # 這一格 + 檔頭 + 它的依據
python <PLAN_ROOT>/plan-item.py 0011#5 --history   # + 全部沿革與全部相關觀察
python <PLAN_ROOT>/plan-item.py --list             # 所有活著的 v3 計畫的開放項
```

**When you are about to work on an item, ask for that item. Do not `Read` the plan file.**
A live plan runs to tens of thousands of tokens; the item you need is a few hundred. The
rest is other items, the design document, and text that is deliberately preserved
*because it is no longer true* — superseded decisions and overturned observations, which
read exactly as authoritative as the current ones.

The default view is built to be sufficient on its own: the plan header (so you see the
constraints that bind every item), the item's fields, its 正文, and every observation in
its `basis` **in full**, with any that a later observation overturned marked as such —
something reading the raw file cannot do for you.

- **`--history`** when you are auditing, or when you need to know why 正文 says what it
  says — everything, with superseded entries and overturned observations marked.
  **There is nothing in between**: a healthy item's 沿革 is at most eight lines, so a
  filtered middle view would be optimising something that is not scarce.
- **v1 / v2 plans have no addressable items.** The tool says so and stops, rather than
  answering partially — a partial answer about a plan is worse than none, because you
  cannot tell which part is missing. Those plans you read whole.

Read a plan in full when you are **writing** one, **auditing** one, or answering a
question about the plan as a whole — not when you are executing one of its items.

## Creating a plan

1. `TZ='Asia/Taipei' date +'%Y%m%d%H%M'`; read `head.md` to see the current HEAD and allocate the next `<seq>`.
2. Determine `prev` (ask if unsure — see above).
3. Write the file from the template, with `- **skill:** plan-history v3`. The 待辦
   section is the real deliverable: every open decision the user still owes an answer
   on goes in as an item with `state: 待決斷`. Evidence you already have goes to
   `## 觀察與推論` with a real timestamp, and the items it justifies cite it in `basis`.
4. Run `update-head.py` and act on anything it reports.
5. Tell the user the path and summarise the plan in chat — do not make them open the
   file to learn what you intend to do.
6. Then implement.

## Updating a plan

- **What you find while implementing goes to `## 觀察與推論`, and you keep going.**
  Do not add it to 待辦, do not open a new plan for it, and do not stop to report it —
  unless it falsifies a premise of the step you are on, in which case the work is wrong
  until it is resolved, so stop and say so. Surface the rest of the observations to the
  user when the batch of work is done, and let them decide which become items.
- **Only the user turns a finding into an item**, and only the user approves a 拆格.
- Move `state` forward as reality moves, and append a 沿革 entry saying why. Never
  delete an item; a terminal state is how an item ends.
- Rewrite 正文 whenever the present changes. Append to 沿革; never edit it.
- Move `status` forward as reality moves. A plan left at `draft` after the code
  shipped is a bug in the history.
- Closing a plan (`superseded`/`abandoned`) means adding `## 捨棄原因` in the same edit.
- New work that changes the *approach* is a new file with `prev` pointing here, not
  a rewrite of this one. Only corrections and outcomes get edited in place.
- **Do not upgrade an older plan's format.** A v1 plan stays v1 forever.
- Run `update-head.py` afterwards.

---

# 讀舊 plan：v1 / v2 的規則

**Their observation timestamps carry no UTC offset, and every one of them was taken on
a UTC machine** — read them as UTC, and never rewrite them into the newer form.
**Their `- **推翻:**` is the broad one**: it may mean the fact was wrong, the inference
was wrong, or simply that time moved. Read it for which, from the text; do not assume
the narrow v3 sense.

These rules are **still in force** for plans that declare v1 or v2. They are here, at
the end, because you only need them when reading or maintaining an older file — never
when writing a new one. Do not apply them to a v3 plan, and do not rewrite an old plan
into the v3 shape.

## v2 的 `## 待決斷/待完成事項`

The checklist describes the present and the future — what is still owed. Each item
that grew out of an observation names it:

```markdown
- [ ] 把 repair 後的 sequence 重跑一次驗證 → O3
```

- **When the basis changes, re-point the arrow** (`→ O3` becomes `→ O7`). The arrow is
  the item's *current* justification, not its history — the history is in the
  observation section, where both O3 and O7 remain.
- **A mid-implementation finding does not become a checklist item on its own.** It goes
  to `## 觀察與推論`. Only the user turns a finding into work.
- Tick boxes as work lands and append the outcome after the item text
  (`- [x] 改用 X — 因為 Y，實測 Z`). Never delete a resolved item.

## v2 的 `## 已移交`

When an item stops being this plan's responsibility and becomes another plan's, move
it out of the checklist and into `## 已移交`, **naming the plan that took it**:

```markdown
- **A2 計數器汙染對照基準** → `0008_20260807_measurement-trust-audit.md` —— 原文與移交理由
```

This is the **only** case where an item legitimately leaves the checklist: it really is
settled here, and the way it was settled is that someone else owns it now — in writing.

**Do not tick the box and add a note saying it is not actually done.** `update-head.py`
counts boxes, so that reading inflates the completion count in `head.md` while the
prose denies it. A plan may reach `done` with items in `## 已移交`; from this plan's
point of view they are closed.

## v1 / v2 的檔案樣板

v1 has no `skill:` line, no `## 觀察與推論` and no `## 已移交`. v2 adds all three and
keeps the checkbox list:

```markdown
# <seq>_<YYYYMMDD>_<topic>

- **prev:** `./<seq>_<YYYYMMDD>_<topic>.md`
- **skill:** plan-history v2
- **status:** draft

## 主題簡述
## 規劃描述
## 觀察與推論
## 待決斷/待完成事項
## 已移交
```