# docket

Append-only record of **facts** and **plans**, so a plan rests only on what can be trusted.
Independent system; no repo coding rules apply to `docket.py`. Spec v0.4.

## Axioms

1. Every write goes through `docket.py`. Files in `log/` are never edited by hand. Add only: no modify, no delete.
2. **One file per plan**: `log/<plan id>.md`. A fact lives in the file of the plan it belongs to:
   a new fact in the plan it was found under (`--in`), a fact about an entry in that entry's own file.
   A closed plan's file takes only claims about its existing entries (`is`), never new facts.
3. Two things exist: **fact** and **plan**. Every change of state is itself a fact about another entry (`on: <id>`).
4. A fact has a **value** (`true` | `false` | `replaced`) and a **basis**:
   - `logic`: a shell `check` exited 0 (or not), run by the tool. Only the tool writes `logic`.
   - `unverified`: a claim by a human or an agent. Both can be wrong; neither outranks the other.
5. Conflicts: `logic` beats `unverified`; within the same basis the latest wins.
   A fact about a fact counts only while it is itself `true`, so a wrong claim is undone by claiming it `false`.
6. `replaced` = held once, no longer: by a newer fact (`--replaces`), or by nothing (a check that passed now fails,
   or `is ID replaced`). `false` = never held.
7. A plan has `need`s (facts or plans) and an optional `verify` (shell command). Needs change by facts (`needs+` / `needs-`).
   A needed fact holds when `true`; a needed plan holds when `solved`. Missing info = open a plan to find it, and need that plan.
8. A plan has **rules**: facts saying how the work must be done (not what must hold first, which is a need).
   A rule binds its plan and every plan that plan needs, while the rule is `true` and its plan is open.
9. A plan closes as `solved` | `unable` | `invalid`, only by **logic** (`verify` exits 0) or a **human**. Agents cannot close.
10. A close is final: it cannot be refuted or reopened. To change it, open a new plan with `--from`.
    A **decision** is a human close; its `why`, when given, is the decision.
11. A `logic` result records the git commit, and `dirty: 1` if the work tree had other changes. Commands time out after 60 s.

## Usage

```
docket.py --by WHO plan "text" [--need ID,ID] [--verify CMD] [--from ID]
docket.py --by WHO fact "text" --in PLAN [--src S] [--check CMD] [--replaces ID]
docket.py --by WHO is ID true|false|replaced [--why W]   # claim about a fact
docket.py --by WHO need PLAN ID,ID
docket.py --by WHO unneed PLAN ID,ID
docket.py --by WHO rule PLAN "text" [--why W]
docket.py --by human close PLAN solved|unable|invalid [--why W]
docket.py verify PLAN       # run verify; exit 0 closes it as solved (logic)
docket.py recheck [ID]      # rerun checks; writes a logic fact only when the result changes
docket.py ready             # open plans whose needs all hold
docket.py brief [PLAN]      # minimal context: verify, rules, needs (broken first)
docket.py ls [--all]        # open plans, true facts, suspect solved plans
docket.py show ID           # entry, every fact about it, who needs it
docket.py lint              # log/ valid and canonical; committed files only ever grew
```

- `WHO`: `human`, `human:<name>`, or an agent name. Env `DOCKET_BY` works too. `logic` is refused.
- IDs are UTC `YYYYMMDDHHMMSS`, unique across all files. Entries replay in id order.
  Input accepts `#` and any unique suffix.
- `--replaces` puts the new fact in the old fact's plan unless `--in` says otherwise.

## Flags

| flag | on a need | on a plan row |
|---|---|---|
| ` ` | true by logic, or plan solved | all needs hold by logic |
| `?` | true but unverified | some need is unverified |
| `…` | plan still open | blocked by an open plan |
| `!` | not true, or plan unable/invalid | some need is broken |

## File format

```
## 20261014101911 plan claude
need: 20261014101900,20261014101905
verify: npm test

move undo stack into history.ts

## 20261014101912 fact claude
src: src/history.ts
check: ! grep -q hooks src/history.ts

history.ts imports no hooks

## 20261014101913 fact logic
on: 20261014101912
is: true
commit: 4b623f6
```

An entry is a `## <id> <plan|fact> <by>` heading, `key: value` lines (one line each), a blank line, then an optional
body (may span lines; no line may start with `## `). The first entry of a file is its plan, and the file name is that id.

| entry | keys | body |
|---|---|---|
| plan | `need?`, `verify?`, `from?` | text (required) |
| fact | `src?`, `check?`, `replaces?` | text (required) |
| fact about a fact | `on`, `is: true\|false\|replaced` (+ `commit`, `dirty?`, `exit?` if logic) | why |
| fact about a plan | `on`, and one of `is: solved\|unable\|invalid`, `needs+`, `needs-`, `rule` | why |

## Known limits

- A passing `check` proves the command exits 0, not that the command expresses the fact's text. That link stays unverified.
- `check` and `verify` run arbitrary shell commands from the log on the local machine.
- A check that times out writes nothing; the fact stays unverified.
- Rules are shown, not enforced.

## Tests

```
python3 -m unittest discover -s docs/docket
```
Black-box: each test copies `docket.py` into a throwaway git repo.
