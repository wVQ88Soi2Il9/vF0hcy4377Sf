#!/usr/bin/env python3
"""Read and validate the plan corpus in `docs/dernoson/plan-history/`.

Stdlib only — no venv needed. This module is not a CLI; it is the **single**
definition of how a plan file is parsed, imported by every tool in this directory
(`update-head.py`, and any reader added later).

Splitting it out is not tidiness: a second hand-written parser for the same format
is how that format starts drifting, and it would drift in the one place nothing else
can catch — the reading of the record itself.

The split is by responsibility, not by size:

- **here** — what a plan file *is*: the header fields, the sections, the observation
  and handoff grammar, and the corpus-wide consistency rules.
- **the CLIs** — what to *do* with that: render `head.md`, answer a query, exit codes.
"""

from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path


def force_utf8_stdio() -> None:
    """Make both CLIs print their Chinese output verbatim on Windows.

    Python picks the console codepage for stdout, which on a zh-TW Windows box is
    cp950 — every plan title and every conflict message comes out as mojibake, and
    the whole point of these tools is printing that text to a reader. Written files
    already pin `encoding="utf-8"`; this is only the streams.
    """
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

# The corpus root. `PLAN_HISTORY_ROOT` exists so the tests can point both CLIs at a
# fixture directory and exercise the real entry points instead of a re-implementation
# of them; in normal use it is unset and this is simply where the scripts live.
HERE = Path(os.environ.get("PLAN_HISTORY_ROOT") or Path(__file__).resolve().parent).resolve()


def _display_root() -> str:
    """How to spell the corpus root in text meant for a human to act on.

    Whoever adopts this skill copies the corpus into *their* `docs/<name>/plan-history/`,
    so a literal path baked into these strings would send them to someone else's
    directory — and `head.md`, where two of these land, is generated, so they could not
    correct it. Deriving it from `HERE` keeps the printed command pointing at the corpus
    the reader is actually holding.

    Relative to the repo root, POSIX separators: `head.md` is committed, and an absolute
    or backslashed path would differ per machine, so a clone on another box would
    regenerate a different file and the up-to-date check would fail. Outside a repo there
    is nothing to be relative to and no committed file to keep stable, so the absolute
    path — still runnable — is the better answer.
    """
    for parent in (HERE, *HERE.parents):
        if (parent / ".git").exists():
            return HERE.relative_to(parent).as_posix()
    return HERE.as_posix()


# Spelled once, at import: every tool prints the same root, and it is only a filesystem
# walk in the first place.
ROOT_DISPLAY = _display_root()

FILENAME_RE = re.compile(r"^(\d{4})_(\d{8,12})_([a-z0-9][a-z0-9-]*)\.md$")
PREV_RE = re.compile(r"^-\s*\*\*prev:\*\*\s*(.+?)\s*$")
SKILL_RE = re.compile(r"^-\s*\*\*skill:\*\*\s*(.+?)\s*$")
SKILL_VERSION_RE = re.compile(r"\bv(\d+)\b")
STATUS_RE = re.compile(r"^-\s*\*\*status:\*\*\s*`?([A-Za-z-]+)`?\s*$")
CHECKBOX_RE = re.compile(r"^\s*-\s*\[([ xX])\]")
BACKTICK_RE = re.compile(r"`([^`]+)`")

# `### O3 · 2026-08-07 15:04:12+08:00 — 短標題`. The offset is required from v3 on; the
# plans written before it are all UTC, and `_instant` reads them that way.
OBS_HEADING_RE = re.compile(
    r"^###\s+O(\d+)\s+·\s+"
    r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2})?)\s+[—-]\s+\S"
)
OBS_OFFSET_RE = re.compile(r"[+-]\d{2}:\d{2}$")
OBS_ID_RE = re.compile(r"\bO(\d+)\b")
OBS_REF_RE = re.compile(r"→\s*O(\d+)\b")
# `- **更正:** O30` / `- **推翻:** O30` / `- **更新:** O30`. One word did all three jobs
# through v2, and they are not the same job: only 更正 says the earlier *fact* was wrong,
# and only that one makes work already done on it wrong too.
OBS_RELATION_RE = re.compile(r"^\s*-\s*\*\*(更正|推翻|更新):\*\*\s*(.+?)\s*$")
CORRECTS = "更正"
LIST_ITEM_RE = re.compile(r"^\s*-\s+\S")

# --- v3 ---------------------------------------------------------------------
# `### 14 讓消融說得出成因`
ITEM_HEADING_RE = re.compile(r"^###\s+(\d+)\s+(\S.*?)\s*$")
# `- **state:** 待實作`
FIELD_RE = re.compile(r"^\s*-\s*\*\*([^:*]+):\*\*\s*(.*?)\s*$")
# `- H2 · 2026-08-09 15:04 落地 —— judge() 回 (verdicts, basis) → O52`
HIST_RE = re.compile(r"^\s*-\s+H(\d+)\s+·\s+(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)\s+(\S+)\s+——\s*(\S.*)$")
HIST_MARKER = "**沿革**"
# `取代 H1` inside a 修正 entry. It marks an entry in `--history` and nothing more:
# no view filters on it, so nothing breaks when an author does not write it.
SUPERSEDE_RE = re.compile(r"取代\s*H(\d+)")
# `0007#14` — the one address form, valid anywhere including prose.
ADDR_RE = re.compile(r"\b(\d{4})#(\d+)\b")

ITEM_STATES = ("待決斷", "待實作", "實作中", "完成", "否決", "移交")
TERMINAL_STATES = ("完成", "否決", "移交")
HIST_KINDS = ("決斷", "落地", "修正", "否決", "拆格", "合併", "改題", "移交")

BODY_MAX_LINES = 15
BASIS_MAX_REFS = 3
HISTORY_MAX_ENTRIES = 8
RETITLE_MAX = 2
SUMMARY_MAX_LINES = 20

STATUSES = ("draft", "in-progress", "done", "superseded", "abandoned")
CLOSED = ("superseded", "abandoned")
LIVE_STATUSES = ("draft", "in-progress")
OPEN_ITEMS_HEADING = "## 待決斷/待完成事項"
TODO_HEADING = "## 待辦"
SUMMARY_HEADING = "## 主題簡述"
REASON_HEADING = "## 捨棄原因"
OBSERVATION_HEADING = "## 觀察與推論"
HANDOFF_HEADING = "## 已移交"

CURRENT_VERSION = 3
# A plan with no `- **skill:**` line predates versioning and is v1 — the v2 checks
# below never apply to it, and it is never rewritten into the newer format.
DEFAULT_VERSION = 1

# Files in this directory that are not plans.
NON_PLAN_FILES = ("head.md", "README.md")


@dataclass
class Observation:
    num: int
    stamp: str
    heading: str
    lines: list[str] = field(default_factory=list)  # body, without the heading
    relations: dict[str, list[int]] = field(default_factory=dict)  # kind -> targets
    inbound: dict[str, list[int]] = field(default_factory=dict)  # kind -> sources

    @property
    def corrected_by(self) -> list[int]:
        """Observations that declared this one's *fact* wrong — the only relation with
        a machine consequence, because everything still resting on it is now wrong."""
        return self.inbound.get(CORRECTS, [])


@dataclass
class HistoryEntry:
    num: int
    date: str
    kind: str
    text: str
    obs_refs: list[int] = field(default_factory=list)
    supersedes: list[int] = field(default_factory=list)  # `取代 H<n>`, a reader's marker

    @property
    def line(self) -> str:
        return f"- H{self.num} · {self.date} {self.kind} —— {self.text}"


@dataclass
class Item:
    """One `### <n> 標題` block in a v3 plan's `## 待辦`."""

    seq: str  # the owning plan's seq, so `addr` is self-contained
    num: int
    title: str
    state: str | None = None
    needs: list[str] = field(default_factory=list)  # `<seq>#<n>` addresses
    handoff: list[str] = field(default_factory=list)  # `- **移交:**`
    claims: list[str] = field(default_factory=list)  # `- **承接:**`
    basis: list[int] = field(default_factory=list)
    body: list[str] = field(default_factory=list)  # 正文, verbatim
    history: list[HistoryEntry] = field(default_factory=list)

    @property
    def addr(self) -> str:
        return f"{self.seq}#{self.num}"

    @property
    def is_open(self) -> bool:
        return self.state not in TERMINAL_STATES

    @property
    def body_lines(self) -> int:
        return sum(1 for ln in self.body if ln.strip())

    @property
    def retitles(self) -> int:
        return sum(1 for h in self.history if h.kind == "改題")

    def overgrown_signals(self) -> list[str]:
        """Which size signals this item trips. Two or more is a warning."""
        hits = []
        if self.body_lines > BODY_MAX_LINES:
            hits.append(f"正文 {self.body_lines} 行 > {BODY_MAX_LINES}")
        if len(self.basis) > BASIS_MAX_REFS:
            hits.append(f"basis {len(self.basis)} 條 > {BASIS_MAX_REFS}")
        if len(self.history) >= HISTORY_MAX_ENTRIES:
            hits.append(f"沿革 {len(self.history)} 條 ≥ {HISTORY_MAX_ENTRIES}")
        if self.retitles >= RETITLE_MAX:
            hits.append(f"改題 {self.retitles} 次 ≥ {RETITLE_MAX}")
        return hits


@dataclass
class Plan:
    path: Path
    seq: str
    date: str
    topic: str
    title: str | None = None
    status: str | None = None
    prev: str | None = None  # target filename, or None for "no parent"
    prev_raw: str = ""
    skill_raw: str = ""
    version: int = DEFAULT_VERSION
    has_reason: bool = False
    total: int = 0
    open_items: int = 0
    obs_ids: set[int] = field(default_factory=set)
    obs_refs: set[int] = field(default_factory=set)
    handoffs: list[str] = field(default_factory=list)  # target filenames ("" = missing)
    items: list[Item] = field(default_factory=list)  # v3 only
    addr_refs: set[str] = field(default_factory=set)  # every `<seq>#<n>` in the file
    summary: list[str] = field(default_factory=list)  # `## 主題簡述`, verbatim
    observations: dict[int, Observation] = field(default_factory=dict)

    @property
    def summary_lines(self) -> int:
        return sum(1 for ln in self.summary if ln.strip())

    @property
    def name(self) -> str:
        return self.path.name

    @property
    def stem(self) -> str:
        return self.path.stem

    @property
    def handoff_count(self) -> int:
        if self.version >= 3:
            return sum(1 for it in self.items if it.state == "移交")
        return len(self.handoffs)


@dataclass
class Conflict:
    code: str
    plan: str
    detail: str
    severity: str = "conflict"  # or "warning" — warnings never fail the exit code


@dataclass
class Report:
    plans: list[Plan] = field(default_factory=list)
    conflicts: list[Conflict] = field(default_factory=list)

    @property
    def errors(self) -> list[Conflict]:
        return [c for c in self.conflicts if c.severity != "warning"]

    @property
    def warnings(self) -> list[Conflict]:
        return [c for c in self.conflicts if c.severity == "warning"]


def _instant(stamp: str) -> datetime:
    """A comparable moment, so a file may hold both stamp forms and still order right.

    An observation written before the offset rule carries no zone; every one of those
    was taken on a UTC machine, so that is what they are read as.
    """
    dt = datetime.fromisoformat(stamp)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def section(lines: list[str], heading: str) -> list[str]:
    """Lines under `heading`, up to the next `## ` heading."""
    out: list[str] = []
    inside = False
    for line in lines:
        if line.startswith("## "):
            if inside:
                break
            inside = line.strip() == heading
            continue
        if inside:
            out.append(line)
    return out


def parse_v2_sections(plan: Plan, lines: list[str], conflicts: list[Conflict]) -> None:
    """Observation section and handoff section — v2 plans only.

    Observations are evidence stamped with the moment they were taken; the checklist
    cites them with `→ O<n>`. They are append-only, so timestamps never go backwards,
    and an observation that a later one overturns still stays exactly as written.
    """
    obs_lines = section(lines, OBSERVATION_HEADING)
    last_ts = ""
    current: Observation | None = None
    for line in obs_lines:
        if not line.startswith("### "):
            if current is not None:
                current.lines.append(line)
            continue
        m = OBS_HEADING_RE.match(line)
        if not m:
            current = None
            conflicts.append(
                Conflict(
                    "BAD_FORMAT",
                    plan.name,
                    f"observation heading {line.strip()!r} is not "
                    "`### O<n> · YYYY-MM-DD HH:MM:SS — 標題`",
                )
            )
            continue
        num, ts = int(m.group(1)), m.group(2)
        if plan.version >= 3 and not OBS_OFFSET_RE.search(ts):
            conflicts.append(
                Conflict(
                    "BAD_FORMAT",
                    plan.name,
                    f"O{num} is stamped {ts!r} with no UTC offset — write "
                    "`+08:00`, so the moment says which clock it was read from",
                )
            )
        if num in plan.obs_ids:
            conflicts.append(Conflict("BAD_FORMAT", plan.name, f"observation O{num} defined twice"))
        plan.obs_ids.add(num)
        current = Observation(num=num, stamp=ts, heading=line.rstrip())
        plan.observations.setdefault(num, current)
        if last_ts and _instant(ts) < _instant(last_ts):
            conflicts.append(
                Conflict(
                    "OBS_OUT_OF_ORDER",
                    plan.name,
                    f"O{num} is stamped {ts}, before the observation above it ({last_ts}) — "
                    "observations are appended oldest to newest, and the later one wins",
                )
            )
        last_ts = ts if not last_ts or _instant(ts) > _instant(last_ts) else last_ts

    if not plan.obs_ids:
        conflicts.append(
            Conflict("BAD_FORMAT", plan.name, f"no observation under {OBSERVATION_HEADING!r}")
        )

    # `→ O<n>` in the checklist, and `- **推翻:** O<n>` inside the observations.
    for line in section(lines, OPEN_ITEMS_HEADING):
        plan.obs_refs.update(int(n) for n in OBS_REF_RE.findall(line))
    current = None
    for line in obs_lines:
        if line.startswith("### ") and (m := OBS_HEADING_RE.match(line)):
            current = plan.observations.get(int(m.group(1)))
        elif om := OBS_RELATION_RE.match(line):
            kind, hit = om.group(1), [int(n) for n in OBS_ID_RE.findall(om.group(2))]
            plan.obs_refs.update(hit)
            if current is not None:
                current.relations.setdefault(kind, []).extend(hit)

    for obs in plan.observations.values():
        for kind, targets in obs.relations.items():
            for num in targets:
                if target := plan.observations.get(num):
                    target.inbound.setdefault(kind, []).append(obs.num)

    for line in section(lines, HANDOFF_HEADING):
        if not LIST_ITEM_RE.match(line):
            continue
        bt = BACKTICK_RE.search(line)
        plan.handoffs.append(bt.group(1).strip().lstrip("./") if bt else "")
        if not bt:
            conflicts.append(
                Conflict(
                    "BROKEN_HANDOFF",
                    plan.name,
                    f"handoff {line.strip()!r} names no target plan — a handed-off item "
                    "must say which plan took it",
                )
            )


def _split_addrs(raw: str) -> list[str]:
    return [f"{a}#{b}" for a, b in ADDR_RE.findall(raw)]


def parse_v3_items(plan: Plan, lines: list[str], conflicts: list[Conflict]) -> None:
    """`## 待辦` — one `### <n> 標題` block per item.

    An item carries its present (rewritable 正文) and its past (append-only 沿革) in
    separate containers, so the current state is readable without replaying history.
    """

    def bad(detail: str) -> None:
        conflicts.append(Conflict("BAD_ITEM_FORMAT", plan.name, detail))

    todo_lines = section(lines, TODO_HEADING)
    if not todo_lines:
        conflicts.append(
            Conflict("BAD_FORMAT", plan.name, f"no item section under {TODO_HEADING!r}")
        )
        return

    item: Item | None = None
    in_history = False
    seen_nums: set[int] = set()

    for line in todo_lines:
        if line.startswith("### "):
            m = ITEM_HEADING_RE.match(line)
            if not m:
                bad(f"item heading {line.strip()!r} is not `### <n> 標題`")
                item, in_history = None, False
                continue
            num = int(m.group(1))
            if num in seen_nums:
                bad(f"item {num} defined twice")
            seen_nums.add(num)
            item = Item(seq=plan.seq, num=num, title=m.group(2))
            plan.items.append(item)
            in_history = False
            continue

        if item is None:
            continue

        if line.strip() == HIST_MARKER:
            in_history = True
            continue

        if in_history:
            if not line.strip():
                continue
            hm = HIST_RE.match(line)
            if not hm:
                bad(f"{item.addr} 沿革 line {line.strip()[:40]!r} is not `- H<n> · YYYY-MM-DD <kind> —— …`")
                continue
            hnum, kind, text = int(hm.group(1)), hm.group(3), hm.group(4)
            if kind not in HIST_KINDS:
                bad(f"{item.addr} H{hnum} kind {kind!r} not one of {', '.join(HIST_KINDS)}")
            if any(h.num == hnum for h in item.history):
                bad(f"{item.addr} H{hnum} used twice")
            refs = [int(n) for n in OBS_REF_RE.findall(line)]
            item.history.append(
                HistoryEntry(
                    num=hnum,
                    date=hm.group(2),
                    kind=kind,
                    text=text,
                    obs_refs=refs,
                    supersedes=[int(n) for n in SUPERSEDE_RE.findall(text)],
                )
            )
            plan.obs_refs.update(refs)
            continue

        if fm := FIELD_RE.match(line):
            key, value = fm.group(1).strip(), fm.group(2)
            if key == "state":
                item.state = value
            elif key == "needs":
                item.needs.extend(_split_addrs(value))
            elif key == "移交":
                item.handoff.extend(_split_addrs(value))
            elif key == "承接":
                item.claims.extend(_split_addrs(value))
            elif key == "basis":
                # The whole field is a list of observations behind one arrow
                # (`→ O51、O30、O15`), so every `O<n>` in it counts — unlike a 沿革
                # line, where only the arrow-anchored one is the citation.
                item.basis.extend(int(n) for n in OBS_ID_RE.findall(value))
                plan.obs_refs.update(item.basis)
            continue

        if line.strip() or item.body:
            item.body.append(line)

    for it in plan.items:
        if it.state is None:
            bad(f"{it.addr} has no `- **state:**` line")
        elif it.state not in ITEM_STATES:
            bad(f"{it.addr} state {it.state!r} not one of {', '.join(ITEM_STATES)}")
        if it.state == "移交" and not it.handoff:
            bad(f"{it.addr} is 移交 but names no target — write `- **移交:** <seq>#<n>`")
        if it.handoff and it.state != "移交":
            bad(f"{it.addr} names a 移交 target but its state is {it.state!r}")

    plan.total = len(plan.items)
    plan.open_items = sum(1 for it in plan.items if it.is_open)
    if plan.total == 0:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, f"no item under {TODO_HEADING!r}"))


def parse_plan(path: Path, conflicts: list[Conflict]) -> Plan | None:
    m = FILENAME_RE.match(path.name)
    if not m:
        conflicts.append(
            Conflict("BAD_FORMAT", path.name, "filename is not <seq>_<YYYYMMDDHHMM>_<topic>.md")
        )
        return None

    plan = Plan(path=path, seq=m.group(1), date=m.group(2), topic=m.group(3))
    lines = path.read_text(encoding="utf-8").splitlines()

    for line in lines:
        if plan.title is None and line.startswith("# "):
            plan.title = line[2:].strip()
        elif plan.status is None and (sm := STATUS_RE.match(line)):
            plan.status = sm.group(1)
        elif not plan.prev_raw and (pm := PREV_RE.match(line)):
            plan.prev_raw = pm.group(1)
            if bt := BACKTICK_RE.search(plan.prev_raw):
                plan.prev = bt.group(1).strip().lstrip("./")
        elif not plan.skill_raw and (km := SKILL_RE.match(line)):
            plan.skill_raw = km.group(1)
            if vm := SKILL_VERSION_RE.search(plan.skill_raw):
                plan.version = int(vm.group(1))

    plan.has_reason = bool("".join(section(lines, REASON_HEADING)).strip())

    if plan.title is None:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, "no `# ` title line"))
    elif plan.title != plan.stem:
        conflicts.append(
            Conflict("BAD_FORMAT", plan.name, f"title {plan.title!r} != filename stem")
        )

    if plan.status is None:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, "no `- **status:**` line"))
    elif plan.status not in STATUSES:
        conflicts.append(
            Conflict(
                "BAD_FORMAT",
                plan.name,
                f"status {plan.status!r} not one of {', '.join(STATUSES)}",
            )
        )

    if not plan.prev_raw:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, "no `- **prev:**` line"))

    if plan.skill_raw and plan.version == DEFAULT_VERSION and "v1" not in plan.skill_raw:
        conflicts.append(
            Conflict(
                "BAD_FORMAT",
                plan.name,
                f"`- **skill:** {plan.skill_raw}` carries no `v<n>` version",
            )
        )

    if plan.version >= 3:
        plan.summary = section(lines, SUMMARY_HEADING)
        plan.addr_refs.update(_split_addrs("\n".join(lines)))
    else:
        items = [CHECKBOX_RE.match(line) for line in section(lines, OPEN_ITEMS_HEADING)]
        boxes = [m.group(1) for m in items if m]
        plan.total = len(boxes)
        plan.open_items = sum(1 for b in boxes if b == " ")
        if plan.total == 0:
            conflicts.append(
                Conflict("BAD_FORMAT", plan.name, f"no checklist under {OPEN_ITEMS_HEADING!r}")
            )

    if plan.version >= 2:
        parse_v2_sections(plan, lines, conflicts)
    if plan.version >= 3:
        parse_v3_items(plan, lines, conflicts)

    # After every section has contributed its references, so a v3 `basis` arrow is
    # checked by the same rule as a v2 checklist arrow.
    for num in sorted(plan.obs_refs - plan.obs_ids):
        conflicts.append(
            Conflict("BROKEN_OBS_REF", plan.name, f"O{num} is referenced but never defined")
        )

    return plan


def check(plans: list[Plan], conflicts: list[Conflict]) -> None:
    by_name = {p.name: p for p in plans}
    successors: dict[str, list[str]] = {}
    for p in plans:
        if p.prev:
            successors.setdefault(p.prev, []).append(p.name)

    for p in plans:
        if p.status == "done" and p.open_items:
            conflicts.append(
                Conflict(
                    "DONE_WITH_OPEN_ITEMS",
                    p.name,
                    f"status is done but {p.open_items}/{p.total} checklist item(s) "
                    "are still unchecked — finish them, or move the status back",
                )
            )
        if p.status in CLOSED and not p.has_reason:
            conflicts.append(
                Conflict(
                    "MISSING_REASON",
                    p.name,
                    f"status is {p.status} but there is no non-empty {REASON_HEADING!r} section",
                )
            )
        if p.status == "superseded" and not successors.get(p.name):
            conflicts.append(
                Conflict(
                    "SUPERSEDED_WITHOUT_SUCCESSOR",
                    p.name,
                    "no other plan's prev points here — a superseded plan must have a "
                    "successor that took over its goal; otherwise it is abandoned",
                )
            )
        if p.prev and p.prev not in by_name:
            conflicts.append(
                Conflict("BROKEN_PREV", p.name, f"prev points at {p.prev!r}, which does not exist")
            )
        if p.prev == p.name:
            conflicts.append(Conflict("BROKEN_PREV", p.name, "prev points at itself"))
        for target in p.handoffs:
            if not target:
                continue  # already reported at parse time
            if target == p.name:
                conflicts.append(
                    Conflict("BROKEN_HANDOFF", p.name, "an item is handed off to this same plan")
                )
            elif target not in by_name:
                conflicts.append(
                    Conflict(
                        "BROKEN_HANDOFF", p.name, f"handed off to {target!r}, which does not exist"
                    )
                )


def item_index(plans: list[Plan]) -> dict[str, Item]:
    """Every addressable item in the corpus, keyed by `<seq>#<n>`."""
    return {it.addr: it for p in plans if p.version >= 3 for it in p.items}


def blockers(item: Item, index: dict[str, Item]) -> list[str]:
    """Prerequisites of `item` that have not reached a terminal state.

    Blockedness is computed, never stored — a stored copy would go stale the moment a
    prerequisite lands. `STARVED` and `head.md` both read it from here, so they can
    never disagree about who can start.
    """
    return [a for a in item.needs if (t := index.get(a)) and t.is_open]


def startable(item: Item, index: dict[str, Item]) -> bool:
    """The agent can act on this item without asking anyone."""
    return item.is_open and item.state != "待決斷" and not blockers(item, index)


def display_state(item: Item, index: dict[str, Item]) -> str:
    """What to show a reader: the stored state, unless something is in the way."""
    if item.is_open and blockers(item, index):
        return "阻塞"
    return item.state or "?"


def _cycles(edges: dict[str, list[str]]) -> list[list[str]]:
    """Every cycle root reachable in the `needs` graph, as a path for the message."""
    WHITE, GREY, BLACK = 0, 1, 2
    colour: dict[str, int] = {}
    found: list[list[str]] = []
    stack: list[str] = []

    def walk(node: str) -> None:
        colour[node] = GREY
        stack.append(node)
        for nxt in edges.get(node, ()):
            if colour.get(nxt, WHITE) == WHITE:
                walk(nxt)
            elif colour.get(nxt) == GREY:
                found.append(stack[stack.index(nxt) :] + [nxt])
        stack.pop()
        colour[node] = BLACK

    for node in edges:
        if colour.get(node, WHITE) == WHITE:
            walk(node)
    return found


def check_v3(plans: list[Plan], conflicts: list[Conflict]) -> None:
    """Cross-item and cross-plan rules. Only items in v3 plans take part."""
    v3 = [p for p in plans if p.version >= 3]
    if not v3:
        return

    by_addr = item_index(plans)
    plan_of: dict[str, Plan] = {it.addr: p for p in v3 for it in p.items}
    known_seqs = {p.seq for p in plans}

    def resolve(src: Plan, addr: str, what: str) -> Item | None:
        if addr in by_addr:
            return by_addr[addr]
        seq = addr.split("#")[0]
        why = (
            f"plan {seq} does not exist"
            if seq not in known_seqs
            else f"plan {seq} is not v3, so it has no addressable items"
            if not any(p.seq == seq for p in v3)
            else "no such item in that plan"
        )
        conflicts.append(Conflict("DANGLING_REF", src.name, f"{what} names {addr} — {why}"))
        return None

    for p in v3:
        for it in p.items:
            for addr in it.needs:
                resolve(p, addr, f"{it.addr} needs")
            for addr in it.handoff:
                resolve(p, addr, f"{it.addr} 移交")
            for addr in it.claims:
                resolve(p, addr, f"{it.addr} 承接")
        # Prose references get the same treatment — they are the ones nothing could
        # check before, and they are how one plan silently invalidates another.
        owned = {a for it in p.items for a in (*it.needs, *it.handoff, *it.claims)}
        for addr in sorted(p.addr_refs - owned - {it.addr for it in p.items}):
            resolve(p, addr, "a reference in the text")

    # Handoff is only real when both ends say so; one-sided handoff is how an
    # obligation evaporates between two files.
    for p in v3:
        for it in p.items:
            for addr in it.handoff:
                if (target := by_addr.get(addr)) and it.addr not in target.claims:
                    conflicts.append(
                        Conflict(
                            "UNCLAIMED_HANDOFF",
                            p.name,
                            f"{it.addr} hands off to {addr}, but {addr} carries no "
                            f"`- **承接:** {it.addr}` — nothing is holding that obligation",
                        )
                    )
            for addr in it.claims:
                if (source := by_addr.get(addr)) and it.addr not in source.handoff:
                    conflicts.append(
                        Conflict(
                            "ORPHAN_CLAIM",
                            p.name,
                            f"{it.addr} claims to have taken over {addr}, but {addr} "
                            f"does not hand off to it",
                        )
                    )

    edges = {it.addr: [a for a in it.needs if a in by_addr] for p in v3 for it in p.items}
    for cycle in _cycles(edges):
        conflicts.append(
            Conflict("CYCLIC_NEEDS", plan_of[cycle[0]].name, " → ".join(cycle))
        )

    # An item's `basis` is its *current* justification. If an observation there has been
    # 更正'd — declared factually wrong, not merely superseded — the item is arguing from
    # a number we have disavowed, which is `0007` F8's "a false machine fact is worse than
    # no check: it argues the right verdict into the wrong box".
    #
    # 沿革 is deliberately not checked: a past entry citing an observation that was later
    # corrected is a true record of what we believed then, not a mistake to fix.
    for p in v3:
        for it in p.items:
            for num in it.basis:
                obs = p.observations.get(num)
                if obs and obs.corrected_by:
                    by = "、".join(f"O{n}" for n in obs.corrected_by)
                    conflicts.append(
                        Conflict(
                            "STALE_BASIS",
                            p.name,
                            f"{it.addr} still rests on O{num}, whose fact {by} 更正 — "
                            "re-point the basis, and re-examine what was already built on it",
                        )
                    )

    for p in v3:
        if p.summary_lines > SUMMARY_MAX_LINES:
            conflicts.append(
                Conflict(
                    "HEADER_TOO_LONG",
                    p.name,
                    f"{SUMMARY_HEADING} is {p.summary_lines} lines (cap {SUMMARY_MAX_LINES}) — "
                    "it is the only section a per-item reader is shown, not a summary "
                    "of the plan",
                    severity="warning",
                )
            )
        for it in p.items:
            if len(hits := it.overgrown_signals()) >= 2:
                conflicts.append(
                    Conflict(
                        "OVERGROWN",
                        p.name,
                        f"{it.addr} trips {len(hits)} size signals ({'; '.join(hits)}) — "
                        "propose a 拆格 to the user",
                        severity="warning",
                    )
                )

        open_items = [it for it in p.items if it.is_open]
        if p.status == "in-progress" and open_items and not any(
            startable(it, by_addr) for it in open_items
        ):
            conflicts.append(
                Conflict(
                    "STARVED",
                    p.name,
                    f"all {len(open_items)} open item(s) are 待決斷 or blocked by one — "
                    "nobody can proceed until the user decides",
                    severity="warning",
                )
            )


def collect(directory: Path | None = None) -> Report:
    """Parse and check every plan in `directory` (defaults to this one)."""
    root = directory or HERE
    report = Report()
    for path in sorted(root.glob("*.md")):
        if path.name in NON_PLAN_FILES:
            continue
        if plan := parse_plan(path, report.conflicts):
            report.plans.append(plan)
    check(report.plans, report.conflicts)
    check_v3(report.plans, report.conflicts)
    return report


def _block(conflicts: list[Conflict], noun: str) -> list[str]:
    lines = [f"[plan-history] {len(conflicts)} {noun} found:"]
    width = max(len(c.code) for c in conflicts)
    for c in sorted(conflicts, key=lambda c: (c.plan, c.code)):
        lines.append(f"[plan-history]   {c.code:<{width}}  {c.plan}")
        lines.append(f"[plan-history]   {'':<{width}}  └─ {c.detail}")
    return lines


def format_conflicts(conflicts: list[Conflict]) -> str:
    """Errors first, then warnings — warnings never change the exit code."""
    errors = [c for c in conflicts if c.severity != "warning"]
    warnings = [c for c in conflicts if c.severity == "warning"]
    out: list[str] = []
    if errors:
        out += _block(errors, "conflict(s)")
    if warnings:
        out += _block(warnings, "warning(s)")
    return "\n".join(out)
