---
name: plan-history
description: Record and maintain this repo's plan history under your own plan root (see Plan Root in the skill body). Use BEFORE starting any non-trivial development, refactor, bug fix, or content change — write the plan file first, then implement. Also use when the user asks for a plan / proposal document, when continuing or forking from an earlier plan, and when updating a plan's status or task list after work lands.
---

# Plan History

**Version: v3**

## Plan Root

All references to `<PLAN_ROOT>` in this document point to the repository's plan directory:

```
<PLAN_ROOT> = docs/plan-history
```

The three `.py` helper scripts treat their parent directory as the corpus root (when `PLAN_HISTORY_ROOT` is unset). `head.md` is an aggregated summary generated automatically by script and must **never** be manually edited.

Every planned change to this repo leaves a trace in `<PLAN_ROOT>/`: one flat directory, one `.md` per plan, chained through a `prev` pointer so a direction change is a new file that names its ancestor rather than an edit that erases it.

Three kinds of content live in a plan, kept strictly apart because their time semantics differ:

- **Observations (`## Observations & Inferences`)** — facts stamped with the moment they were taken. Append-only. An observation reflects the precise moment it was recorded; the judgement made on it stays true forever.
- **Task Body (`## Tasks`)** — what is owed *right now*. Rewritable; rewriting it represents the current active plan.
- **Task History (`History`)** — how this task got to be the way it is. Append-only.

Collapsing any two of these into one container causes files to grow without bound: facts masquerade as unfinished work, or the current state has to be reconstructed by reading a stack of edits in chronological order.

Four mechanical pieces live alongside the plans:

- **`head.md`** — the entry point: which plan is current, and every open item. **Generated. Never hand-edit it** — read it, and let the script write it.
- **`update-head.py`** — regenerates `head.md` and reports conflicts.
- **`plan-item.py`** — returns **one task item** instead of a whole plan.
- **`plan_parse.py`** — the single definition of how a plan file is parsed and validated, shared by both CLIs so they cannot disagree about what a plan says.

## When to Use

**Create a plan file before touching code** whenever the user asks for development, refactoring, a bug fix, a doc restructure, or any change that will take more than a couple of edits. Write the file, show the user the plan, then implement.

**Create a plan file on request** when the user asks for a plan or proposal document, even if no implementation follows immediately.

**Update the existing plan file** when work lands, an open question gets decided, or a direction is dropped.

Skip the plan file only for: answering questions, read-only investigation, and single-spot mechanical edits the user has already fully specified (typo, renaming a single symbol, bumping a version). When in doubt, write the file — it is cheap.

## Filename

```
<PLAN_ROOT>/<seq>_<YYYYMMDDHHMM>_<topic>.md
```

- `<seq>` — 4-digit zero-padded, globally increasing, never reused. Allocate the next one by inspecting existing plans:
  ```bash
  ls <PLAN_ROOT>/[0-9]*.md 2>/dev/null | tail -1
  ```
- `<YYYYMMDDHHMM>` — 12-digit creation timestamp (to the minute). In Taipei time:
  ```bash
  TZ='Asia/Taipei' date +'%Y%m%d%H%M'
  ```
- `<topic>` — short lowercase ASCII kebab-case, 2–5 words (`dv-status-rollup`, `ot-regmap-systemrdl`). Not a full sentence.

The sequence number is global, not per-branch: two plans may share the same `prev` (a fork), and their sequence numbers still differ.

## File Template (v3)

```markdown
# <seq>_<YYYYMMDDHHMM>_<topic>

- **status:** draft
- **prev:** `./<seq>_<YYYYMMDDHHMM>_<topic>.md`
- **skill:** plan-history v3

## Abandonment Reason

(Included only when status is superseded or abandoned; otherwise omit this entire section.)
Why work stopped, and which plan succeeded it.

## Summary

Problem description, goals, and rationale for doing this now. Conclude with plan-level constraints.

## Proposed Changes

How to implement — steps, affected files/modules, trade-offs, and design rationale.

## Observations & Inferences

### O1 · YYYY-MM-DD HH:MM:SS+08:00 — Short Title

Factual description: measurements, inputs, specific files and line numbers.

Inference: what this fact implies and why.

## Tasks

### 1 Short Title

- **state:** pending
- **basis:** → O1

Body: the complete, current description of this task.

**History**

- H1 · YYYY-MM-DD HH:MM decision —— What was decided (human: <name>)
```

The H1 heading must match the filename stem exactly (minus `.md`). Section headings are fixed — keep the section names verbatim for `plan_parse.py` to parse them.

## `## Summary` — Header & Plan-Level Constraints

`## Summary` is the **only** section a per-item reader is shown alongside the specific task item requested. It carries two things and nothing else: why this plan exists, and the constraints that bind every item in it.

```markdown
**Plan Constraints**

- Do not sweep traceability loops across remaining modules before conclusions land.
```

- **A constraint that belongs to one item is not written here** — it is part of that item's body, and travels with the item if handed off. A constraint is never a task itself and never a `state`; it is prose attached to whatever it constrains.
- **Hard cap ~20 lines**; exceeding this triggers a warning. This section is not a detailed summary of implementation — `## Proposed Changes` is.

## `## Observations & Inferences`

This is where findings during implementation are recorded. A finding is a fact about a specific moment in time; it is not a task. Recording findings as tasks makes plans grow indefinitely — the implementation is finite, the investigation is not.

```markdown
### O3 · 2026-08-07 15:04:12+08:00 — Re-verification missed after repair rewrite

- **overturns:** O1

Factual description (measurements, input context, file line numbers).

Inference: what this implies and why.
```

- **`O<n>`** — increments within a plan file, never reused. The identifier allows tasks to cite observations stably.
- **Timestamp** — Taipei time with the offset explicitly written out:

  ```bash
  TZ='Asia/Taipei' date +'%Y-%m-%d %H:%M:%S+08:00'
  ```

  The offset is mandatory. Unzoned timestamps cause ambiguous drift between local and remote environments. Observations are appended chronologically from oldest to newest.
- **When two observations in one plan contradict each other, the later timestamp wins.**
- **A relation never edits the observation it points at.** O1 was true when recorded; timestamps reflect this. Never rewrite or delete an earlier observation.

### Three Relations Between Observations

| relation | what it says | what the reader must do |
| --- | --- | --- |
| `- **corrects:** O1` | **O1's fact is wrong** (mis-measured, incorrect input, misread output) | Stop citing O1, and re-examine everything built on it |
| `- **overturns:** O1` | O1's fact stands; the **inference** drawn from it does not | Re-check conclusions; the observed fact remains |
| `- **updates:** O1` | O1 was true then and is not now (tree moved, re-run executed) | Nothing; both observations hold for their respective moments |

- **`updates` is the most common.** Every rerun produces it.
- **`corrects` is the only one with machine consequences.** Any task whose `basis` still points at a corrected observation triggers `STALE_BASIS`. History entries are not checked, as past records reflect what was believed at that time.

## `## Tasks`

One task item is one `### <n> Title` block. **`<n>` is a plain integer**, increasing within the plan, never reused. Grouping by theme belongs in prose, not in the ID.

```markdown
### 14 Enable ablation cause reporting

- **state:** todo
- **needs:** 0007#12
- **basis:** → O51, O30, O15

After ablation runs, verify report generation, error logs, and failed steps. Preserve judgement basis rather than raw stdout.

**History**

- H1 · 2026-08-09 decision —— Retain judgement basis instead of full stdout (human: user)
- H2 · 2026-08-09 landed —— `judge()` returns `(verdicts, basis)` → O52
- H3 · 2026-08-09 revised —— Hypothesis ruled out in unique instance; body updated → O51 (supersedes H1)
```

### Addressing: Always `<seq>#<n>`

Reference items as `0007#14` **everywhere, including within the same plan and in prose**. A single uniform format enables complete automated cross-reference validation.

### `state` — Closed Vocabulary

| value | meaning |
| --- | --- |
| `pending` | An open question that **the user owes an answer on** |
| `todo` | Decided, not yet started |
| `in-progress` | Started, actively being implemented |
| `pending-review` | Landed, awaiting human verification / acceptance |
| `done` | Done — **Human-exclusive verdict**; Agent must not set this |
| `rejected` | Decided not to do — **Human-exclusive verdict**; reason noted in body and history |
| `handed-off` | Another item now owns it; `- **handoff:**` names the target item |

- **There is no `owner` field.** It is derived: `pending` awaits the user; `todo` / `in-progress` belongs to the agent; `pending-review` awaits human verification.
- **`done` and `rejected` are Human-exclusive**: Agents are forbidden from marking tasks as `done` or `rejected`. When an Agent finishes implementation, append a `landed` history entry (`→ O<n>`) and set state to `pending-review`.
- **There is no `blocked` state in storage.** It is dynamically computed from `needs`.
- Terminal states are `done`, `rejected`, and `handed-off`.

### `needs` — Unidirectional Dependencies

```markdown
- **needs:** 0007#12, 0010#3
```

`needs` lists tasks that must reach a terminal state before this task can start. It can cross plan files. Reverse blockers are computed dynamically.

### `basis` — Current Justification

```markdown
- **basis:** → O51, O30, O15
```

Every observation this task currently rests on. When the basis changes, update the pointer; previous observations remain in `## Observations & Inferences`.

### Task Body — Current State (Rewritable)

The item's complete current scope: required end state, acceptance criteria, agreed approach, and constraints.
- Rewrite freely as reality evolves. History is preserved in `History`, which is append-only.
- Soft cap ~15 lines; exceeding triggers a warning.

### Task History — Past Changes (Append-Only)

One line per entry, `H<n>` increasing within the item:

`H<n> · <YYYY-MM-DD> <kind> —— <summary> [→ O<n>] [(actor / supersedes H<n>)]`

| kind | when |
| --- | --- |
| `decision` | A question was resolved — specify source |
| `landed` | Implementation reached repository tree → O |
| `revised` | Basis changed and body was rewritten → O |
| `rejected` | This task or alternative was rejected (Human exclusive) |
| `split` / `merged` | Task structure changed |
| `retitle` | Records previous title |
| `handed-off` | Names target item |
| `question` | A question raised — must include identity attribution at end |
| `answer` | An answer provided — must include identity attribution at end |

- **Attribution format for `question` and `answer`**:
  - Human: `(human: <name>)` (prioritize local `git config user.name`) or `(human: user)`.
  - Agent: must specify model name, e.g. `(agent: gemini-3.7-flash)`.

### Retitling & Splitting

- **Retitling** costs one `retitle` entry in `History` recording the old title.
- **Splitting** reuses handoff mechanisms: mark parent task as `handed-off` pointing to children, or keep parent alive with `needs` if only part is split out. Splitting is proposed by the agent and decided by the user.

## `status`

| value | meaning |
| --- | --- |
| `draft` | Written, not yet approved or started |
| `in-progress` | Actively being implemented |
| `done` | Landed; every task in a terminal state |
| `superseded` | Goal still stands; another plan took it over |
| `abandoned` | Dropped; no plan picked up the goal |

Closed statuses (`superseded` / `abandoned`) require a non-empty `## Abandonment Reason`.

## `prev`

`prev` records which plan this one continues from, maintaining logical genealogy rather than bare chronology.

## `head.md` and Tooling

`head.md` is generated. It lists every open item across live plans (`id · state · title`). HEAD is the highest-seq `in-progress` plan; failing that, highest `draft`; failing that, highest `done`.

Run the script after every plan creation or modification:

```bash
python <PLAN_ROOT>/update-head.py
```

### Tool Error and Warning Codes

| code | meaning |
| --- | --- |
| `DONE_WITH_OPEN_ITEMS` | `done` plan contains tasks not in a terminal state |
| `MISSING_REASON` | `superseded`/`abandoned` plan missing abandonment reason |
| `SUPERSEDED_WITHOUT_SUCCESSOR` | marked `superseded` but no successor plan points to it |
| `BROKEN_PREV` | `prev` points to a non-existent file |
| `BAD_FORMAT` | Heading, filename, or section syntax invalid |
| `BROKEN_OBS_REF` | Observation reference points to undefined `O<n>` |
| `OBS_OUT_OF_ORDER` | Observation timestamps do not increase chronologically |
| `BROKEN_HANDOFF` | Handoff target missing or invalid |
| `STALE_BASIS` | Task `basis` points to a corrected observation |
| `BAD_ITEM_FORMAT` | Task missing state or invalid history syntax |
| `DANGLING_REF` | Reference points to a non-existent task |
| `UNCLAIMED_HANDOFF` | Handoff target does not claim the task |
| `ORPHAN_CLAIM` | Task claims handoff that source did not grant |
| `CYCLIC_NEEDS` | Dependency cycle detected in `needs` |
| `STARVED` (warning) | Plan `in-progress` but all items are pending or blocked |
| `OVERGROWN` (warning) | Item exceeds multiple size thresholds |
| `HEADER_TOO_LONG` (warning) | Summary exceeds 20 lines |

## Reading One Item vs Whole Plan

```bash
python <PLAN_ROOT>/plan-item.py 0001#1             # Single task item + plan header + basis
python <PLAN_ROOT>/plan-item.py 0001#1 --history   # + Full history and related observations
python <PLAN_ROOT>/plan-item.py --list             # List all open tasks across live plans
```

When executing an individual task, query that specific item rather than reading entire historical plan files.