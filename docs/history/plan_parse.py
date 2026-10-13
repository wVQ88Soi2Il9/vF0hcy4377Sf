#!/usr/bin/env python3
"""讀取並檢查 `docs/history/` 下的計畫（plan-history v4）。

僅使用標準函式庫。本模組不是 CLI，而是「計畫檔怎麼讀」的唯一定義，
由同目錄下所有工具匯入（`update-head.py`、`plan-item.py`）。

- 這裡：計畫檔是什麼 —— 檔頭欄位、各節、觀察與待辦的文法、跨檔一致性規則。
- 各 CLI：拿這些做什麼 —— 產生 head.md、回答查詢、決定結束碼。
"""

from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


def force_utf8_stdio() -> None:
    """讓中文輸出在 Windows 主控台也不亂碼（預設 codepage 是 cp950）。"""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


# 計畫目錄。`PLAN_HISTORY_ROOT` 讓測試可以把工具指向 fixture 目錄；平常不設，就是腳本所在處。
HERE = Path(os.environ.get("PLAN_HISTORY_ROOT") or Path(__file__).resolve().parent).resolve()


def _display_root() -> str:
    for parent in (HERE, *HERE.parents):
        if (parent / ".git").exists():
            return HERE.relative_to(parent).as_posix()
    return HERE.as_posix()


ROOT_DISPLAY = _display_root()

VERSION = 4

FILENAME_RE = re.compile(r"^(\d{4})_(\d{12})_([a-z0-9][a-z0-9-]*)\.md$")
PREV_RE = re.compile(r"^-\s*\*\*prev:\*\*\s*(.+?)\s*$")
SKILL_RE = re.compile(r"^-\s*\*\*skill:\*\*\s*(.+?)\s*$")
STATUS_RE = re.compile(r"^-\s*\*\*status:\*\*\s*`?([A-Za-z-]+)`?\s*$")
BACKTICK_RE = re.compile(r"`([^`]+)`")

# `### O3 · 2026-08-07 15:04:12+08:00 — 短標題`
OBS_HEADING_RE = re.compile(
    r"^###\s+O(\d+)\s+·\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2})\s+[—-]\s+\S"
)
OBS_ID_RE = re.compile(r"\bO(\d+)\b")
OBS_REF_RE = re.compile(r"→\s*O(\d+)\b")

# `### 14 標題`、`- **state:** 待實作`、`- H2 · 2026-08-09 15:04 落地 —— 一行 → O52`
ITEM_HEADING_RE = re.compile(r"^###\s+(\d+)\s+(\S.*?)\s*$")
FIELD_RE = re.compile(r"^\s*-\s*\*\*([^:*]+):\*\*\s*(.*?)\s*$")
HIST_RE = re.compile(r"^\s*-\s+H(\d+)\s+·\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s+(\S+)\s+——\s*(\S.*)$")
HIST_MARKER = "**沿革**"
# `0007#14` —— 唯一的位址寫法，內文裡也一樣。
ADDR_RE = re.compile(r"\b(\d{4})#(\d+)\b")

ITEM_STATES = ("待實作", "等待確認", "完成", "否決", "移交")
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

SUMMARY_HEADING = "## 主題簡述"
REASON_HEADING = "## 捨棄原因"
OBSERVATION_HEADING = "## 觀察與推論"
TODO_HEADING = "## 待辦"

# 這個目錄裡不是計畫的檔案。
NON_PLAN_FILES = ("head.md", "readme.md", "README.md")


@dataclass
class Observation:
    num: int
    stamp: str
    heading: str
    lines: list[str] = field(default_factory=list)  # 內文，不含標題


@dataclass
class HistoryEntry:
    num: int
    date: str
    kind: str
    text: str
    obs_refs: list[int] = field(default_factory=list)

    @property
    def line(self) -> str:
        return f"- H{self.num} · {self.date} {self.kind} —— {self.text}"


@dataclass
class Item:
    """`## 待辦` 裡的一個 `### <n> 標題` 區塊。"""

    seq: str  # 所屬計畫的 seq，讓 `addr` 自成一格
    num: int
    title: str
    state: str | None = None
    needs: list[str] = field(default_factory=list)  # `<seq>#<n>`
    handoff: list[str] = field(default_factory=list)  # `- **移交:**`
    basis: list[int] = field(default_factory=list)
    body: list[str] = field(default_factory=list)  # 正文，原樣保留
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
    prev: str | None = None  # 目標檔名；None 表示沒有上一份
    prev_raw: str = ""
    skill_raw: str = ""
    has_reason: bool = False
    summary: list[str] = field(default_factory=list)
    observations: dict[int, Observation] = field(default_factory=dict)
    obs_refs: set[int] = field(default_factory=set)
    items: list[Item] = field(default_factory=list)
    addr_refs: set[str] = field(default_factory=set)  # 檔內出現的所有 `<seq>#<n>`

    @property
    def name(self) -> str:
        return self.path.name

    @property
    def stem(self) -> str:
        return self.path.stem

    @property
    def summary_lines(self) -> int:
        return sum(1 for ln in self.summary if ln.strip())

    @property
    def total(self) -> int:
        return len(self.items)

    @property
    def open_items(self) -> int:
        return sum(1 for it in self.items if it.is_open)

    @property
    def handoff_count(self) -> int:
        return sum(1 for it in self.items if it.state == "移交")


@dataclass
class Conflict:
    code: str
    plan: str
    detail: str
    severity: str = "conflict"  # 或 "warning" —— 警告不影響結束碼


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


def section(lines: list[str], heading: str) -> list[str]:
    """`heading` 底下、到下一個 `## ` 之前的行。"""
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


def _split_addrs(raw: str) -> list[str]:
    return [f"{a}#{b}" for a, b in ADDR_RE.findall(raw)]


def parse_observations(plan: Plan, lines: list[str], conflicts: list[Conflict]) -> None:
    """觀察是蓋了時間戳的事實，只增不改；時間戳必須由舊到新。"""
    last: datetime | None = None
    last_raw = ""
    current: Observation | None = None
    for line in section(lines, OBSERVATION_HEADING):
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
                    f"觀察標題 {line.strip()!r} 不是 `### O<n> · YYYY-MM-DD HH:MM:SS+08:00 — 標題`",
                )
            )
            continue
        num, stamp = int(m.group(1)), m.group(2)
        if num in plan.observations:
            conflicts.append(Conflict("BAD_FORMAT", plan.name, f"觀察 O{num} 定義了兩次"))
        current = Observation(num=num, stamp=stamp, heading=line.rstrip())
        plan.observations.setdefault(num, current)
        moment = datetime.fromisoformat(stamp)
        if last is not None and moment < last:
            conflicts.append(
                Conflict(
                    "OBS_OUT_OF_ORDER",
                    plan.name,
                    f"O{num} 的時間 {stamp} 早於上一條（{last_raw}）—— 觀察由舊到新追加",
                )
            )
        if last is None or moment > last:
            last, last_raw = moment, stamp

    if not plan.observations:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, f"{OBSERVATION_HEADING!r} 底下沒有任何觀察"))


def parse_items(plan: Plan, lines: list[str], conflicts: list[Conflict]) -> None:
    """`## 待辦`：每格把現在（可重寫的正文）與過去（只增的沿革）放在不同容器。"""

    def bad(detail: str) -> None:
        conflicts.append(Conflict("BAD_ITEM_FORMAT", plan.name, detail))

    todo_lines = section(lines, TODO_HEADING)
    if not todo_lines:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, f"沒有 {TODO_HEADING!r} 這一節"))
        return

    item: Item | None = None
    in_history = False
    seen: set[int] = set()

    for line in todo_lines:
        if line.startswith("### "):
            m = ITEM_HEADING_RE.match(line)
            if not m:
                bad(f"待辦標題 {line.strip()!r} 不是 `### <n> 標題`")
                item, in_history = None, False
                continue
            num = int(m.group(1))
            if num in seen:
                bad(f"第 {num} 格定義了兩次")
            seen.add(num)
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
                bad(f"{item.addr} 的沿革 {line.strip()[:40]!r} 不是 `- H<n> · YYYY-MM-DD HH:MM <種類> —— …`")
                continue
            hnum, kind, text = int(hm.group(1)), hm.group(3), hm.group(4)
            if kind not in HIST_KINDS:
                bad(f"{item.addr} H{hnum} 的種類 {kind!r} 不在 {'、'.join(HIST_KINDS)}")
            if any(h.num == hnum for h in item.history):
                bad(f"{item.addr} H{hnum} 重複使用")
            refs = [int(n) for n in OBS_REF_RE.findall(line)]
            item.history.append(HistoryEntry(hnum, hm.group(2), kind, text, refs))
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
            elif key == "basis":
                item.basis.extend(int(n) for n in OBS_ID_RE.findall(value))
                plan.obs_refs.update(item.basis)
            continue

        if line.strip() or item.body:
            item.body.append(line)

    for it in plan.items:
        if it.state is None:
            bad(f"{it.addr} 沒有 `- **state:**`")
        elif it.state not in ITEM_STATES:
            bad(f"{it.addr} 的 state {it.state!r} 不在 {'、'.join(ITEM_STATES)}")
        if it.state == "移交" and not it.handoff:
            bad(f"{it.addr} 是 移交 卻沒有目標 —— 寫 `- **移交:** <seq>#<n>`")
        if it.handoff and it.state != "移交":
            bad(f"{it.addr} 寫了 移交 目標，但 state 是 {it.state!r}")

    if not plan.items:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, f"{TODO_HEADING!r} 底下沒有任何一格"))


def parse_plan(path: Path, conflicts: list[Conflict]) -> Plan | None:
    m = FILENAME_RE.match(path.name)
    if not m:
        conflicts.append(
            Conflict("BAD_FORMAT", path.name, "檔名不是 <seq>_<YYYYMMDDHHMM>_<topic>.md")
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

    plan.has_reason = bool("".join(section(lines, REASON_HEADING)).strip())

    if plan.title is None:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, "沒有 `# ` 標題行"))
    elif plan.title != plan.stem:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, f"標題 {plan.title!r} 與檔名不同"))

    if plan.status is None:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, "沒有 `- **status:**`"))
    elif plan.status not in STATUSES:
        conflicts.append(
            Conflict("BAD_FORMAT", plan.name, f"status {plan.status!r} 不在 {'、'.join(STATUSES)}")
        )

    if not plan.prev_raw:
        conflicts.append(Conflict("BAD_FORMAT", plan.name, "沒有 `- **prev:**`"))

    if plan.skill_raw != f"plan-history v{VERSION}":
        conflicts.append(
            Conflict(
                "BAD_FORMAT",
                plan.name,
                f"`- **skill:**` 必須是 `plan-history v{VERSION}`（現在是 {plan.skill_raw!r}）",
            )
        )

    plan.summary = section(lines, SUMMARY_HEADING)
    plan.addr_refs.update(_split_addrs("\n".join(lines)))

    parse_observations(plan, lines, conflicts)
    parse_items(plan, lines, conflicts)

    for num in sorted(plan.obs_refs - set(plan.observations)):
        conflicts.append(Conflict("BROKEN_OBS_REF", plan.name, f"O{num} 被引用但從未定義"))

    return plan


def item_index(plans: list[Plan]) -> dict[str, Item]:
    """整個目錄裡所有可定址的格子，以 `<seq>#<n>` 為鍵。"""
    return {it.addr: it for p in plans for it in p.items}


def blockers(item: Item, index: dict[str, Item]) -> list[str]:
    """尚未到達終態的前置項。阻塞是算出來的，不存 —— 存了就會在前置完成時過期。"""
    return [a for a in item.needs if (t := index.get(a)) and t.is_open]


def display_state(item: Item, index: dict[str, Item]) -> str:
    if item.is_open and blockers(item, index):
        return "阻塞"
    return item.state or "?"


def claimed_by(index: dict[str, Item]) -> dict[str, list[str]]:
    """反向的移交關係（承接）。只存單向 `移交`，承接由此算出。"""
    out: dict[str, list[str]] = {}
    for it in index.values():
        for target in it.handoff:
            out.setdefault(target, []).append(it.addr)
    return out


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


def check(plans: list[Plan], conflicts: list[Conflict]) -> None:
    by_name = {p.name: p for p in plans}
    successors: dict[str, list[str]] = {}
    by_seq: dict[str, list[str]] = {}
    for p in plans:
        by_seq.setdefault(p.seq, []).append(p.name)
        if p.prev:
            successors.setdefault(p.prev, []).append(p.name)

    for seq, names in by_seq.items():
        if len(names) > 1:
            conflicts.append(
                Conflict("DUPLICATE_SEQ", names[0], f"序號 {seq} 被 {'、'.join(names)} 同時使用 —— 序號不重用")
            )

    for p in plans:
        if p.status == "done" and p.open_items:
            conflicts.append(
                Conflict(
                    "DONE_WITH_OPEN_ITEMS",
                    p.name,
                    f"status 是 done，但 {p.open_items}/{p.total} 格還沒到終態 —— 做完，或把 status 改回去",
                )
            )
        if p.status in CLOSED and not p.has_reason:
            conflicts.append(
                Conflict("MISSING_REASON", p.name, f"status 是 {p.status}，但沒有非空的 {REASON_HEADING!r}")
            )
        if p.status == "superseded" and not successors.get(p.name):
            conflicts.append(
                Conflict(
                    "SUPERSEDED_WITHOUT_SUCCESSOR",
                    p.name,
                    "沒有任何計畫的 prev 指向這裡 —— superseded 必須有接手的後繼，否則是 abandoned",
                )
            )
        if p.prev and p.prev not in by_name:
            conflicts.append(Conflict("BROKEN_PREV", p.name, f"prev 指向不存在的 {p.prev!r}"))
        if p.prev == p.name:
            conflicts.append(Conflict("BROKEN_PREV", p.name, "prev 指向自己"))

    index = item_index(plans)
    known_seqs = {p.seq for p in plans}

    def resolve(src: Plan, addr: str, what: str) -> None:
        if addr in index:
            return
        seq = addr.split("#")[0]
        why = f"沒有序號 {seq} 的計畫" if seq not in known_seqs else "那份計畫裡沒有這一格"
        conflicts.append(Conflict("DANGLING_REF", src.name, f"{what} 指向 {addr} —— {why}"))

    for p in plans:
        for it in p.items:
            for addr in it.needs:
                resolve(p, addr, f"{it.addr} needs")
            for addr in it.handoff:
                if addr == it.addr:
                    conflicts.append(
                        Conflict("BAD_ITEM_FORMAT", p.name, f"{it.addr} 移交給自己")
                    )
                else:
                    resolve(p, addr, f"{it.addr} 移交")
        owned = {a for it in p.items for a in (*it.needs, *it.handoff)}
        for addr in sorted(p.addr_refs - owned - {it.addr for it in p.items}):
            resolve(p, addr, "內文的引用")

    edges = {a: [n for n in it.needs if n in index] for a, it in index.items()}
    plan_of = {it.addr: p for p in plans for it in p.items}
    for cycle in _cycles(edges):
        conflicts.append(Conflict("CYCLIC_NEEDS", plan_of[cycle[0]].name, " → ".join(cycle)))

    for p in plans:
        if p.summary_lines > SUMMARY_MAX_LINES:
            conflicts.append(
                Conflict(
                    "HEADER_TOO_LONG",
                    p.name,
                    f"{SUMMARY_HEADING} 有 {p.summary_lines} 行（上限 {SUMMARY_MAX_LINES}）—— "
                    "它是讀單格時唯一會一起顯示的節，不是整份計畫的摘要",
                    severity="warning",
                )
            )
        for it in p.items:
            if len(hits := it.overgrown_signals()) >= 2:
                conflicts.append(
                    Conflict(
                        "OVERGROWN",
                        p.name,
                        f"{it.addr} 觸發 {len(hits)} 個過大訊號（{'；'.join(hits)}）—— 向使用者提議拆格",
                        severity="warning",
                    )
                )


def collect(directory: Path | None = None) -> Report:
    """解析並檢查 `directory`（預設是本目錄）裡的所有計畫。"""
    root = directory or HERE
    report = Report()
    for path in sorted(root.glob("*.md")):
        if path.name in NON_PLAN_FILES:
            continue
        if plan := parse_plan(path, report.conflicts):
            report.plans.append(plan)
    check(report.plans, report.conflicts)
    return report


def _block(conflicts: list[Conflict], noun: str) -> list[str]:
    lines = [f"[plan-history] 發現 {len(conflicts)} 項{noun}："]
    width = max(len(c.code) for c in conflicts)
    for c in sorted(conflicts, key=lambda c: (c.plan, c.code)):
        lines.append(f"[plan-history]   {c.code:<{width}}  {c.plan}")
        lines.append(f"[plan-history]   {'':<{width}}  └─ {c.detail}")
    return lines


def format_conflicts(conflicts: list[Conflict]) -> str:
    """先列衝突，再列警告；警告不改變結束碼。"""
    errors = [c for c in conflicts if c.severity != "warning"]
    warnings = [c for c in conflicts if c.severity == "warning"]
    out: list[str] = []
    if errors:
        out += _block(errors, "衝突")
    if warnings:
        out += _block(warnings, "警告")
    return "\n".join(out)
