---
name: docket
description: Check which recorded facts a plan can trust, and record new facts and plans in docs/docket/ (append-only, one file per plan). Use before planning or starting non-trivial work, when you learn something that confirms or contradicts a recorded fact, and before relying on an old note.
---

# docket

Append-only facts and plans in `docs/docket/log/`. Tool: `python3 docs/docket/docket.py`.
Axioms, file format and flags: `docs/docket/README.md`.

- Never edit `log/` by hand; every write goes through the tool.
- Pass `--by <your own name>` (or set `DOCKET_BY`). `--by human` is for a human's own words; never use it yourself.
- Agents cannot `close` a plan. Report it as awaiting human acceptance.

## Workflow

1. **Before work**: `brief` (all open plans) or `brief PLAN`.
   - Trust order: no flag (`logic` verified) > `?` (unverified claim).
   - `!` is broken: do not build on it. `…` is blocked by an open plan.
   - `rules` bind your work, including rules inherited from plans that need this one.
2. **Missing info**: do not guess. Open a plan to find it (`plan "find X"`) and `need` it.
3. **While working**: record what you learn, under the plan you found it:
   `fact "text" --in PLAN [--src FILE] [--check CMD]`.
   Prefer a `--check` a command can verify; a passing check outranks any claim.
4. **When a recorded fact is wrong or outdated**, mark it at once; otherwise nobody does:
   - wrong: `is ID false --why ...`
   - outdated: `fact "new text" --replaces ID`, or `is ID replaced`
   - a check you disagree with: fix the code or the check, do not argue with it.
5. **Before relying on checked facts**: `recheck`.
6. **Done**: if the plan has `verify`, `verify PLAN` closes it when the command passes. Otherwise stop and report.
7. **Before committing**: `lint`.

## Commands

```
brief [PLAN] · ready · ls [--all] · show ID
plan "text" [--need ID,ID] [--verify CMD] [--from ID]
fact "text" --in PLAN [--src S] [--check CMD] [--replaces ID]
is ID true|false|replaced [--why W] · need|unneed PLAN ID,ID · rule PLAN "text"
verify PLAN · recheck [ID] · lint
```

IDs are 14-digit times; any unique suffix works. `--help` lists everything.
