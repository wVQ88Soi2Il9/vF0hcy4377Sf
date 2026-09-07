#!/usr/bin/env python3
"""Read and validate the plan corpus in `docs/plan-history/`.

Stdlib only — no venv needed. This module is not a CLI; it is the **single**
definition of how a plan file is parsed, imported by every tool in this directory
(`update-head.py`, and any reader added later).

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
    """Ensure standard streams use UTF-8 on all platforms."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

# The corpus root. `PLAN_HISTORY_ROOT` exists so tests can point both CLIs at a
# fixture directory; in normal use it is unset and this is where the scripts live.
HERE = Path(os.environ.get("PLAN_HISTORY_ROOT") or Path(__file__).resolve().parent).resolve()


def _display_root() -> str:
    """How to spell the corpus root in text meant for a human to act on."""
    for parent in (HERE, *HERE.parents):
        if (parent / ".git").exists():
            return HERE.relative_to(parent).as_posix()
    return HERE.as_posix()


ROOT_DISPLAY = _display_root()

FILENAME_RE = re.compile(r"^(\d{4})_(\d{8,12})_([a-z0-9][a-z0-9-]*)\.md$")
PREV_RE = re.compile(r"^-\s*\*\*prev:\*\*\s*(.+?)\s*$")
SKILL_RE = re.compile(r"^-\s*\*\*skill:\*\*\s*(.+?)\s*$")
SKILL_VERSION_RE = re.compile(r"\bv(\d+)\b")
STATUS_RE = re.compile(r"^-\s*\*\*status:\*\*\s*`?([A-Za-z-]+)`?\s*$")
BACKTICK_RE = re.compile(r"`([^`]+)`")

# `### O3 · 2026-08-07 15:04:12+08:00 — Short title`
OBS_HEADING_RE = re.compile(
    r"^###\s+O(\d+)\s+·\s+"
    r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2})?)\s+[—-]\s+\S"
)
OBS_OFFSET_RE = re.compile(r"[+-]\d{2}:\d{2}$")
OBS_ID_RE = re.compile(r"\bO(\d+)\b")
OBS_REF_RE = re.compile(r"→\s*O(\d+)\b")
# `- **corrects:** O30` / `- **overturns:** O30` / `- **updates:** O30`
OBS_RELATION_RE = re.compile(
    r"^\s*-\s*\*\*(corrects|overturns|updates):\*\*\s*(.+?)\s*$",
    re.IGNORECASE,
)
CORRECTS = "corrects"
LIST_ITEM_RE = re.compile(r"^\s*-\s+\S")

# --- v3 ---------------------------------------------------------------------
# `### 14 Short title`
ITEM_HEADING_RE = re.compile(r"^###\s+(\d+)\s+(\S.*?)\s*$")
# `- **state:** todo`
FIELD_RE = re.compile(r"^\s*-\s*\*\*([^:*]+):\*\*\s*(.*?)\s*$")
# `- H2 · 2026-08-09 15:04 landed —— judge() returns (verdicts, basis) → O52`
HIST_RE = re.compile(r"^\s*-\s+H(\d+)\s+·\s+(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)\s+(\S+)\s+——\s*(\S.*)$")
HIST_MARKER = "**History**"
# `supersedes H1` inside a revised entry
SUPERSEDE_RE = re.compile(r"supersedes\s*H(\d+)", re.IGNORECASE)
# `0007#14` — address form
ADDR_RE = re.compile(r"\b(\d{4})#(\d+)\b")

ITEM_STATES = ("pending", "todo", "in-progress", "pending-review", "done", "rejected", "handed-off")
TERMINAL_STATES = ("done", "rejected", "handed-off")

HIST_KINDS = (
    "decision",
    "landed",
    "revised",
    "rejected",
    "split",
    "merged",
    "retitle",
    "handed-off",
    "question",
    "answer",
)
ACTOR_TAG_RE = re.compile(r"[（\(]([^（\(\)）]+)[）\)](?:\s*→\s*O\d+)?\s*$")

BODY_MAX_LINES = 15
BASIS_MAX_REFS = 3
HISTORY_MAX_ENTRIES = 8
RETITLE_MAX = 2
SUMMARY_MAX_LINES = 20

STATUSES = ("draft", "in-progress", "done", "superseded", "abandoned")
CLOSED = ("superseded", "abandoned")
LIVE_STATUSES = ("draft", "in-progress")

TODO_HEADING = "## Tasks"
SUMMARY_HEADING = "## Summary"
REASON_HEADING = "## Abandonment Reason"
OBSERVATION_HEADING = "## Observations & Inferences"

CURRENT_VERSION = 3
DEFAULT_VERSION = 3

NON_PLAN_FILES = ("head.md", "readme.md", "README.md")


@dataclass
class Observation:
    num: int
    stamp: str
    heading: str
    lines: list[str] = field(default_factory=list)
    relations: dict[str, list[int]] = field(default_factory=dict)
    inbound: dict[str, list[int]] = field(default_factory=dict)

    @property
    def corrected_by(self) -> list[int]:
        """Observations that declared this one's fact wrong."""
        return self.inbound.get(CORRECTS, [])


@dataclass
class HistoryEntry:
    num: int
    date: str
    kind: str
    text: str
    obs_refs: list[int] = field(default_factory=list)
    supersedes: list[int] = field(default_factory=list)

    @property
    def line(self) -> str:
        return f"- H{self.num} · {self.date} {self.kind} —— {self.text}"


@dataclass
class Item:
    """One task block in a v3 plan's tasks section."""

    seq: str
    num: int
    title: str
    state: str | None = None
    needs: list[str] = field(default_factory=list)
    handoff: list[str] = field(default_factory=list)
    claims: list[str] = field(default_factory=list)
    basis: list[int] = field(default_factory=list)
    body: list[str] = field(default_factory=list)
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
        return sum(1 for h in self.history if h.kind == "retitle")

    def overgrown_signals(self) -> list[str]:
        hits = []
        if self.body_lines > BODY_MAX_LINES:
            hits.append(f"body {self.body_lines} lines > {BODY_MAX_LINES}")
        if len(self.basis) > BASIS_MAX_REFS:
            hits.append(f"basis {len(self.basis)} items > {BASIS_MAX_REFS}")
        if len(self.history) >= HISTORY_MAX_ENTRIES:
            hits.append(f"history {len(self.history)} entries >= {HISTORY_MAX_ENTRIES}")
        if self.retitles >= RETITLE_MAX:
            hits.append(f"retitled {self.retitles} times >= {RETITLE_MAX}")
        return hits


@dataclass
class Plan:
    path: Path
    seq: str
    date: str
    topic: str
    title: str | None = None
    status: str | None = None
    prev: str | None = None
    prev_raw: str = ""
    skill_raw: str = ""
    version: int = CURRENT_VERSION
    has_reason: bool = False
    total: int = 0
    open_items: int = 0
    obs_ids: set[int] = field(default_factory=set)
    obs_refs: set[int] = field(default_factory=set)
    handoffs: list[str] = field(default_factory=list)
    items: list[Item] = field(default_factory=list)
    addr_refs: set[str] = field(default_factory=set)
    summary: list[str] = field(default_factory=list)
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
        return sum(1 for it in self.items if it.state == "handed-off")


@dataclass
class Conflict:
    code: str
    plan: str
    detail: str
    severity: str = "conflict"


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
    dt = datetime.fromisoformat(stamp)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def section(lines: list[str], heading: str) -> list[str]:
    """Lines under heading, up to the next `## ` heading."""
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


def parse_observations(plan: Plan, lines: list[str], conflicts: list[Conflict]) -> None:
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
                    "`### O<n> · YYYY-MM-DD HH:MM:SS — Title`",
                )
            )
            continue
        num, ts = int(m.group(1)), m.group(2)
        if not OBS_OFFSET_RE.search(ts):
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
            Conflict("BAD_FORMAT", plan.name, f"no observation found under {OBSERVATION_HEADING!r}")
        )

    for line in obs_lines:
        if line.startswith("### ") and (m := OBS_HEADING_RE.match(line)):
            current = plan.observations.get(int(m.group(1)))
        elif om := OBS_RELATION_RE.match(line):
            rel_kind = om.group(1).lower()
            hit = [int(n) for n in OBS_ID_RE.findall(om.group(2))]
            plan.obs_refs.update(hit)
            if current is not None:
                current.relations.setdefault(rel_kind, []).extend(hit)

    for obs in plan.observations.values():
        for kind, targets in obs.relations.items():
            for num in targets:
                if target := plan.observations.get(num):
                    target.inbound.setdefault(kind, []).append(obs.num)


def _split_addrs(raw: str) -> list[str]:
    return [f"{a}#{b}" for a, b in ADDR_RE.findall(raw)]


def parse_v3_items(plan: Plan, lines: list[str], conflicts: list[Conflict]) -> None:
    def bad(detail: str) -> None:
        conflicts.append(Conflict("BAD_ITEM_FORMAT", plan.name, detail))

    todo_lines = section(lines, TODO_HEADING)
    if not todo_lines:
        conflicts.append(
            Conflict("BAD_FORMAT", plan.name, f"no task section under {TODO_HEADING!r}")
        )
        return

    item: Item | None = None
    in_history = False
    seen_nums: set[int] = set()

    for line in todo_lines:
        if line.startswith("### "):
            m = ITEM_HEADING_RE.match(line)
            if not m:
                bad(f"item heading {line.strip()!r} is not `### <n> Title`")
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

        trimmed = line.strip()
        if trimmed == HIST_MARKER:
            in_history = True
            continue

        if in_history:
            if not trimmed:
                continue
            hm = HIST_RE.match(line)
            if not hm:
                bad(f"{item.addr} history line {trimmed[:40]!r} is not `- H<n> · YYYY-MM-DD <kind> —— …`")
                continue
            hnum, kind, text = int(hm.group(1)), hm.group(3), hm.group(4)
            if kind not in HIST_KINDS:
                bad(f"{item.addr} H{hnum} kind {kind!r} not one of {', '.join(HIST_KINDS)}")
            if kind in ("question", "answer"):
                tag_m = ACTOR_TAG_RE.search(text)
                if not tag_m:
                    bad(f"{item.addr} H{hnum} {kind} must end with actor tag, e.g. `(human: <name>)` or `(agent: <model>)`")
                else:
                    actor = tag_m.group(1).strip()
                    low = actor.lower()
                    if low in ("human", "user") or low.startswith(("human:", "user:")):
                        pass
                    elif low.startswith("agent:"):
                        model_part = actor.split(":", 1)[1].strip()
                        if not model_part:
                            bad(f"{item.addr} H{hnum} {kind} agent must specify model name, e.g. `(agent: gemini-3.7-flash)`")
                    elif low == "agent":
                        bad(f"{item.addr} H{hnum} {kind} agent must specify model name, e.g. `(agent: gemini-3.7-flash)`")
                    else:
                        bad(f"{item.addr} H{hnum} {kind} actor tag {actor!r} invalid, must be `(human: <name>)` or `(agent: <model>)`")
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
            raw_key, value = fm.group(1).strip(), fm.group(2)
            key = raw_key.lower()
            if key == "state":
                item.state = value.strip()
            elif key == "needs":
                item.needs.extend(_split_addrs(value))
            elif key == "handoff":
                item.handoff.extend(_split_addrs(value))
            elif key == "claims":
                item.claims.extend(_split_addrs(value))
            elif key == "basis":
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
        if it.state == "handed-off" and not it.handoff:
            bad(f"{it.addr} is handed-off but names no target — write `- **handoff:** <seq>#<n>`")
        if it.handoff and it.state != "handed-off":
            bad(f"{it.addr} names a handoff target but its state is {it.state!r}")

    plan.total = len(plan.items)
    plan.open_items = sum(1 for it in plan.items if it.is_open)
    if plan.total == 0:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, f"no task items found under {TODO_HEADING!r}"))


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
            plan.status = sm.group(1).lower()
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

    plan.summary = section(lines, SUMMARY_HEADING)
    plan.addr_refs.update(_split_addrs("\n".join(lines)))

    parse_observations(plan, lines, conflicts)
    parse_v3_items(plan, lines, conflicts)

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
                    f"status is done but {p.open_items}/{p.total} task item(s) "
                    "are still open — finish them, or move the status back",
                )
            )
        if p.status in CLOSED and not p.has_reason:
            conflicts.append(
                Conflict(
                    "MISSING_REASON",
                    p.name,
                    f"status is {p.status} but there is no non-empty abandonment reason section",
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
                continue
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
    return {it.addr: it for p in plans for it in p.items}


def blockers(item: Item, index: dict[str, Item]) -> list[str]:
    return [a for a in item.needs if (t := index.get(a)) and t.is_open]


def startable(item: Item, index: dict[str, Item]) -> bool:
    return item.is_open and item.state != "pending" and not blockers(item, index)


def display_state(item: Item, index: dict[str, Item]) -> str:
    if item.is_open and blockers(item, index):
        return "blocked"
    return item.state or "?"


def _cycles(edges: dict[str, list[str]]) -> list[list[str]]:
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
    if not plans:
        return

    by_addr = item_index(plans)
    plan_of: dict[str, Plan] = {it.addr: p for p in plans for it in p.items}
    known_seqs = {p.seq for p in plans}

    def resolve(src: Plan, addr: str, what: str) -> Item | None:
        if addr in by_addr:
            return by_addr[addr]
        seq = addr.split("#")[0]
        why = (
            f"plan {seq} does not exist"
            if seq not in known_seqs
            else "no such item in that plan"
        )
        conflicts.append(Conflict("DANGLING_REF", src.name, f"{what} names {addr} — {why}"))
        return None

    for p in plans:
        for it in p.items:
            for addr in it.needs:
                resolve(p, addr, f"{it.addr} needs")
            for addr in it.handoff:
                resolve(p, addr, f"{it.addr} handoff")
            for addr in it.claims:
                resolve(p, addr, f"{it.addr} claims")
        owned = {a for it in p.items for a in (*it.needs, *it.handoff, *it.claims)}
        for addr in sorted(p.addr_refs - owned - {it.addr for it in p.items}):
            resolve(p, addr, "a reference in the text")

    for p in plans:
        for it in p.items:
            for addr in it.handoff:
                if (target := by_addr.get(addr)) and it.addr not in target.claims:
                    conflicts.append(
                        Conflict(
                            "UNCLAIMED_HANDOFF",
                            p.name,
                            f"{it.addr} hands off to {addr}, but {addr} carries no "
                            f"`- **claims:** {it.addr}` — nothing is holding that obligation",
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

    edges = {it.addr: [a for a in it.needs if a in by_addr] for p in plans for it in p.items}
    for cycle in _cycles(edges):
        conflicts.append(
            Conflict("CYCLIC_NEEDS", plan_of[cycle[0]].name, " → ".join(cycle))
        )

    for p in plans:
        for it in p.items:
            for num in it.basis:
                obs = p.observations.get(num)
                if obs and obs.corrected_by:
                    by = ", ".join(f"O{n}" for n in obs.corrected_by)
                    conflicts.append(
                        Conflict(
                            "STALE_BASIS",
                            p.name,
                            f"{it.addr} still rests on O{num}, whose fact was corrected by {by} — "
                            "re-point the basis, and re-examine what was already built on it",
                        )
                    )

    for p in plans:
        if p.summary_lines > SUMMARY_MAX_LINES:
            conflicts.append(
                Conflict(
                    "HEADER_TOO_LONG",
                    p.name,
                    f"summary is {p.summary_lines} lines (cap {SUMMARY_MAX_LINES}) — "
                    "it is the only section a per-item reader is shown, not a full plan summary",
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
                        "propose splitting the item to the user",
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
                    f"all {len(open_items)} open item(s) are pending or blocked — "
                    "nobody can proceed until the user decides",
                    severity="warning",
                )
            )


def collect(directory: Path | None = None) -> Report:
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
    errors = [c for c in conflicts if c.severity != "warning"]
    warnings = [c for c in conflicts if c.severity == "warning"]
    out: list[str] = []
    if errors:
        out += _block(errors, "conflict(s)")
    if warnings:
        out += _block(warnings, "warning(s)")
    return "\n".join(out)
