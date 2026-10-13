#!/usr/bin/env python3
"""docket v1 —— 給人與 agent 共用的工作紀錄 CLI。

僅使用標準函式庫。規格見 `docs/archive/QA/2610140516.md`。

    docket.py [--root DIR] new <slug> --topic TEXT [--prev THREAD]
    docket.py [--root DIR] add <thread> q|d|o|t --title TEXT [--answers A..] [--supersedes A..]
                                                 [--needs A..] [--basis A..]      # 正文從 stdin
    docket.py [--root DIR] set <addr> <state> [--source TEXT] [--to ADDR] [--note TEXT] [--ref A..]
    docket.py [--root DIR] note <addr> <kind> <text>      # 只用於 T 的沿革
    docket.py [--root DIR] rewrite <addr>                 # 重寫 T 的正文（stdin）
    docket.py [--root DIR] append <addr>                  # 在 Q 追加補充（stdin）
    docket.py [--root DIR] queue | index | show <addr> [--history] | check [--hook]

所有紀錄檔只能由本工具寫入。`check` 的 `NOT_CANONICAL` 會抓到手改：檔案內容必須等於
「解析後再渲染」的結果。每個寫入指令都先在記憶體裡算出新內容並檢查，若會產生**新的**衝突就拒絕寫入。

根目錄：`--root`，否則環境變數 `DOCKET_ROOT`，否則本檔所在目錄。
設定：根目錄的 `docket.toml`（可省略），目前只讀 `timezone = "+08:00"`；省略時用系統時區。
測試用：環境變數 `DOCKET_NOW=YYYY-MM-DDTHH:MM:SS` 固定「現在」。

結束碼：0 正常 · 1 有衝突 · 2 用法錯誤或寫入被拒。
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import tomllib
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

SPEC = "docket v1"

STATES = {
    "Q": ("open", "dropped"),
    "D": ("proposed", "accepted", "rejected"),
    "O": (),
    "T": ("todo", "landed", "accepted", "rejected", "handed-off"),
}
# 狀態轉移表；Q 未存狀態時視為 open。終態沒有出路。
TRANSITIONS = {
    "Q": {"open": {"dropped"}},
    "D": {"proposed": {"accepted", "rejected"}},
    "T": {
        "todo": {"landed", "handed-off", "rejected"},
        "landed": {"todo", "accepted", "rejected", "handed-off"},
    },
}
SOURCE_STATES = {"accepted", "rejected", "dropped"}
TERMINAL_T = {"accepted", "rejected", "handed-off"}

FIELD_ORDER = ("state", "answers", "supersedes", "needs", "basis", "handoff", "source")
ALLOWED_FIELDS = {
    "Q": {"state", "source"},
    "D": {"state", "answers", "supersedes", "source"},
    "O": set(),
    "T": {"state", "needs", "basis", "handoff", "source"},
}
REF_FIELDS = ("answers", "supersedes", "needs", "basis", "handoff")
REF_TARGETS = {
    "answers": {"Q"},
    "supersedes": {"D"},
    "needs": {"T"},
    "basis": {"O", "D"},
    "handoff": {"T"},
}

THREAD_PATTERN = r"\d{12}_[a-z0-9][a-z0-9-]*"
THREAD_RE = re.compile(rf"^{THREAD_PATTERN}$")
FILE_RE = re.compile(rf"^{THREAD_PATTERN}\.md$")
ADDR_RE = re.compile(rf"^({THREAD_PATTERN})#([1-9]\d*)$")
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
TS_PATTERN = r"\d{4}-\d\d-\d\d \d\d:\d\d:\d\d[+-]\d\d:\d\d"
ENTRY_HEAD_RE = re.compile(rf"^### ([1-9]\d*) · ([QDOT]) · ({TS_PATTERN}) — (.+)$")
FIELD_RE = re.compile(r"^- \*\*([a-z]+):\*\* (.*)$")
HIST_RE = re.compile(r"^- (\d{4}-\d\d-\d\d \d\d:\d\d) (\S+)(?: —— (.*))?$")
SOURCE_RE = re.compile(r"^human: \S.* · 「.+」$")
NOTE_KIND_RE = re.compile(r"^[a-z][a-z0-9-]*$")

OVERGROWN_ENTRIES = 40
HEADER_TOO_LONG_LINES = 20
HISTORY_MARK = "**沿革**"


class DocketError(Exception):
    """使用者可修正的錯誤（用法、拒絕寫入）。"""


class ParseError(Exception):
    pass


# --------------------------------------------------------------------------- 模型


@dataclass
class Hist:
    ts: str  # YYYY-MM-DD HH:MM
    kind: str
    text: str | None = None


@dataclass
class Entry:
    n: int
    kind: str
    ts: str
    title: str
    state: str | None = None
    refs: dict[str, list[str]] = field(default_factory=dict)
    source: str | None = None
    body: str = ""
    history: list[Hist] = field(default_factory=list)

    def addr(self, thread_id: str) -> str:
        return f"{thread_id}#{self.n}"


@dataclass
class Thread:
    id: str
    prev: str | None
    spec: str
    topic: str
    entries: list[Entry] = field(default_factory=list)


@dataclass(frozen=True)
class Conflict:
    level: str  # "error" | "warning"
    code: str
    where: str
    msg: str

    def line(self) -> str:
        return f"{self.level.upper():7} {self.code} {self.where}: {self.msg}"


# --------------------------------------------------------------------------- 渲染


def render_entry(e: Entry) -> str:
    blocks = [f"### {e.n} · {e.kind} · {e.ts} — {e.title}"]
    values = {"state": e.state, "source": e.source}
    fields = []
    for key in FIELD_ORDER:
        if key in REF_FIELDS:
            if e.refs.get(key):
                fields.append(f"- **{key}:** " + "、".join(e.refs[key]))
        elif values.get(key) is not None:
            fields.append(f"- **{key}:** {values[key]}")
    if fields:
        blocks.append("\n".join(fields))
    if e.body:
        blocks.append(e.body)
    if e.kind == "T":
        lines = [f"- {h.ts} {h.kind}" + (f" —— {h.text}" if h.text else "") for h in e.history]
        blocks.append(HISTORY_MARK + "\n\n" + "\n".join(lines) if lines else HISTORY_MARK)
    return "\n\n".join(blocks)


def render(t: Thread) -> str:
    prev = f"`{t.prev}`" if t.prev else "—"
    blocks = [
        f"# {t.id}",
        f"- **prev:** {prev}\n- **spec:** {t.spec}",
        f"## 主題\n\n{t.topic}",
        "## 條目",
        *[render_entry(e) for e in t.entries],
    ]
    return "\n\n".join(blocks) + "\n"


# --------------------------------------------------------------------------- 解析


def _split_blank(lines: list[str]) -> list[str]:
    out = list(lines)
    while out and not out[0].strip():
        out.pop(0)
    while out and not out[-1].strip():
        out.pop()
    return out


def parse_refs(value: str, key: str) -> list[str]:
    parts = value.split("、")
    for p in parts:
        if not ADDR_RE.match(p):
            raise ParseError(f"欄位 {key} 含有不是位址的值：{p!r}")
    return parts


def parse_entry(head: re.Match[str], raw: list[str]) -> Entry:
    n, kind, ts, title = int(head.group(1)), head.group(2), head.group(3), head.group(4)
    e = Entry(n=n, kind=kind, ts=ts, title=title)
    lines = _split_blank(raw)
    seen: set[str] = set()
    i = 0
    while i < len(lines) and (m := FIELD_RE.match(lines[i])):
        key, value = m.group(1), m.group(2)
        if key not in ALLOWED_FIELDS[kind]:
            raise ParseError(f"#{n} 的類型 {kind} 不能有欄位 {key}")
        if key in seen:
            raise ParseError(f"#{n} 的欄位 {key} 重複")
        seen.add(key)
        if key == "state":
            e.state = value
        elif key == "source":
            e.source = value
        else:
            e.refs[key] = parse_refs(value, key)
        i += 1
    rest = _split_blank(lines[i:])
    if kind == "T":
        if HISTORY_MARK in rest:
            k = rest.index(HISTORY_MARK)
            body, hist = rest[:k], _split_blank(rest[k + 1 :])
        else:
            raise ParseError(f"#{n} 是 T，但沒有 {HISTORY_MARK}")
        for line in hist:
            hm = HIST_RE.match(line)
            if not hm:
                raise ParseError(f"#{n} 的沿革格式錯誤：{line!r}")
            e.history.append(Hist(hm.group(1), hm.group(2), hm.group(3)))
        rest = _split_blank(body)
    e.body = "\n".join(rest)
    return e


def parse(text: str, stem: str) -> Thread:
    lines = text.split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    if not lines or not lines[0].startswith("# "):
        raise ParseError("第一行必須是 `# <thread id>`")
    tid = lines[0][2:]
    if not THREAD_RE.match(tid):
        raise ParseError(f"thread id 格式錯誤：{tid!r}")
    if tid != stem:
        raise ParseError(f"檔頭 id {tid!r} 與檔名 {stem!r} 不一致")

    try:
        topic_at = lines.index("## 主題")
        entries_at = lines.index("## 條目")
    except ValueError:
        raise ParseError("缺少 `## 主題` 或 `## 條目`") from None
    if entries_at < topic_at:
        raise ParseError("`## 條目` 出現在 `## 主題` 之前")

    meta = [l for l in lines[1:topic_at] if l.strip()]
    if len(meta) != 2:
        raise ParseError("檔頭必須恰有 prev 與 spec 兩行")
    pm = re.match(r"^- \*\*prev:\*\* (?:`(.+)`|—)$", meta[0])
    sm = re.match(r"^- \*\*spec:\*\* (.+)$", meta[1])
    if not pm or not sm:
        raise ParseError("prev／spec 行格式錯誤")
    prev = pm.group(1)
    if prev is not None and not THREAD_RE.match(prev):
        raise ParseError(f"prev 不是 thread id：{prev!r}")

    thread = Thread(
        id=tid,
        prev=prev,
        spec=sm.group(1),
        topic="\n".join(_split_blank(lines[topic_at + 1 : entries_at])),
    )

    heads = [(i, m) for i in range(entries_at + 1, len(lines)) if (m := ENTRY_HEAD_RE.match(lines[i]))]
    if _split_blank(lines[entries_at + 1 : heads[0][0] if heads else len(lines)]):
        raise ParseError("`## 條目` 與第一個條目之間有多餘內容")
    for k, (i, m) in enumerate(heads):
        end = heads[k + 1][0] if k + 1 < len(heads) else len(lines)
        thread.entries.append(parse_entry(m, lines[i + 1 : end]))
    return thread


# --------------------------------------------------------------------------- 檢查


@dataclass
class Analysis:
    threads: dict[str, Thread]
    conflicts: list[Conflict]

    @property
    def errors(self) -> list[Conflict]:
        return [c for c in self.conflicts if c.level == "error"]


def first_diff(a: str, b: str) -> str:
    la, lb = a.split("\n"), b.split("\n")
    for i in range(max(len(la), len(lb))):
        x = la[i] if i < len(la) else "（檔案結束）"
        y = lb[i] if i < len(lb) else "（檔案結束）"
        if x != y:
            return f"第 {i + 1} 行：檔案是 {x!r}，CLI 渲染為 {y!r}"
    return "內容不同"


def entry_state_problems(t: Thread, e: Entry) -> list[Conflict]:
    where = e.addr(t.id)
    out = []
    err = lambda code, msg: out.append(Conflict("error", code, where, msg))  # noqa: E731
    if e.kind == "O":
        return out
    allowed = STATES[e.kind]
    if e.kind == "Q":
        if e.state is not None and e.state not in allowed[1:]:
            err("BAD_STATE", f"Q 只能不寫 state 或寫 dropped，不是 {e.state!r}")
    elif e.state not in allowed:
        err("BAD_STATE", f"{e.kind} 的 state 必須是 {'／'.join(allowed)}，不是 {e.state!r}")
    effective = e.state or ("open" if e.kind == "Q" else None)
    if effective in SOURCE_STATES:
        if e.source is None:
            err("MISSING_SOURCE", f"{effective} 必須附上 source")
    if e.source is not None and not SOURCE_RE.match(e.source):
        err("MISSING_SOURCE", f"source 格式必須是 `human: <名字> · 「<原話>」`，不是 {e.source!r}")
    if e.kind == "T" and effective == "handed-off" and not e.refs.get("handoff"):
        err("BAD_FORMAT", "handed-off 必須指名 handoff 目標")
    if e.kind == "T" and e.refs.get("handoff") and len(e.refs["handoff"]) != 1:
        err("BAD_FORMAT", "handoff 只能有一個目標")
    return out


def analyze(texts: dict[str, str]) -> Analysis:
    conflicts: list[Conflict] = []
    threads: dict[str, Thread] = {}

    # 檔頭 id 重複（例如複製檔案）
    claimed: dict[str, list[str]] = {}
    for name, text in texts.items():
        first = text.split("\n", 1)[0]
        if first.startswith("# "):
            claimed.setdefault(first[2:], []).append(name)
    dup_ids = {i for i, names in claimed.items() if len(names) > 1}
    for tid in sorted(dup_ids):
        conflicts.append(
            Conflict("error", "DUPLICATE_THREAD", tid, "多個檔案宣稱同一個 thread id：" + "、".join(sorted(claimed[tid])))
        )

    for name in sorted(texts):
        stem = name[: -len(".md")]
        try:
            thread = parse(texts[name], stem)
        except ParseError as exc:
            conflicts.append(Conflict("error", "BAD_FORMAT", name, str(exc)))
            continue
        threads[thread.id] = thread
        if thread.spec != SPEC:
            conflicts.append(Conflict("error", "BAD_FORMAT", name, f"spec 必須是 {SPEC!r}，不是 {thread.spec!r}"))
        rendered = render(thread)
        if rendered != texts[name]:
            conflicts.append(Conflict("error", "NOT_CANONICAL", name, first_diff(texts[name], rendered)))
        for i, e in enumerate(thread.entries, start=1):
            if e.n != i:
                conflicts.append(
                    Conflict("error", "BAD_FORMAT", f"{thread.id}#{e.n}", f"條目編號必須連續：第 {i} 個條目寫成 {e.n}")
                )
            conflicts.extend(entry_state_problems(thread, e))
        if len(thread.entries) > OVERGROWN_ENTRIES:
            conflicts.append(
                Conflict("warning", "OVERGROWN", name, f"{len(thread.entries)} 個條目；考慮拆成新的 thread（prev 串接）")
            )
        if len(thread.topic.split("\n")) > HEADER_TOO_LONG_LINES:
            conflicts.append(Conflict("warning", "HEADER_TOO_LONG", name, "主題超過 20 行"))

    index: dict[str, Entry] = {}
    for t in threads.values():
        for e in t.entries:
            index.setdefault(e.addr(t.id), e)

    # 引用
    for t in threads.values():
        if t.prev is not None and t.prev not in threads:
            conflicts.append(Conflict("error", "DANGLING_REF", t.id, f"prev 指向不存在的 thread：{t.prev}"))
        for e in t.entries:
            for key in REF_FIELDS:
                for target in e.refs.get(key, []):
                    found = index.get(target)
                    if found is None:
                        conflicts.append(
                            Conflict("error", "DANGLING_REF", e.addr(t.id), f"{key} 指向不存在的條目：{target}")
                        )
                    elif found.kind not in REF_TARGETS[key]:
                        conflicts.append(
                            Conflict(
                                "error",
                                "BAD_FORMAT",
                                e.addr(t.id),
                                f"{key} 只能指向 {'／'.join(sorted(REF_TARGETS[key]))}，但 {target} 是 {found.kind}",
                            )
                        )

    conflicts.extend(needs_cycles(index))

    superseded = superseded_set(threads)
    for t in threads.values():
        for e in t.entries:
            if e.kind == "T" and e.state in ("todo", "landed"):
                for target in e.refs.get("basis", []):
                    if target in superseded:
                        conflicts.append(
                            Conflict("error", "BASIS_SUPERSEDED", e.addr(t.id), f"basis 引用了已被取代的決定：{target}")
                        )

    conflicts.sort(key=lambda c: (c.level != "error", c.where, c.code, c.msg))
    return Analysis(threads, conflicts)


def needs_cycles(index: dict[str, Entry]) -> list[Conflict]:
    out: list[Conflict] = []
    color: dict[str, int] = {}
    reported: set[frozenset[str]] = set()

    def visit(addr: str, stack: list[str]) -> None:
        color[addr] = 1
        stack.append(addr)
        for nxt in index[addr].refs.get("needs", []):
            if nxt not in index:
                continue
            if color.get(nxt) == 1:
                cycle = stack[stack.index(nxt) :]
                key = frozenset(cycle)
                if key not in reported:
                    reported.add(key)
                    out.append(Conflict("error", "CYCLIC_NEEDS", cycle[0], "needs 形成循環：" + " → ".join(cycle + [nxt])))
            elif color.get(nxt) is None:
                visit(nxt, stack)
        stack.pop()
        color[addr] = 2

    for addr in sorted(index):
        if index[addr].kind == "T" and color.get(addr) is None:
            visit(addr, [])
    return out


# --------------------------------------------------------------------------- 推導


def all_entries(threads: dict[str, Thread]):
    for tid in sorted(threads):
        for e in threads[tid].entries:
            yield threads[tid], e


def answered_set(threads: dict[str, Thread]) -> set[str]:
    return {a for t, e in all_entries(threads) if e.kind == "D" and e.state == "accepted" for a in e.refs.get("answers", [])}


def superseded_set(threads: dict[str, Thread]) -> set[str]:
    return {a for t, e in all_entries(threads) if e.kind == "D" and e.state == "accepted" for a in e.refs.get("supersedes", [])}


def effective_state(e: Entry) -> str | None:
    return e.state or ("open" if e.kind == "Q" else None)


def is_open(e: Entry, addr: str, answered: set[str]) -> bool:
    s = effective_state(e)
    if e.kind == "Q":
        return s == "open" and addr not in answered
    if e.kind == "D":
        return s == "proposed"
    if e.kind == "T":
        return s in ("todo", "landed")
    return False


def derived_label(t: Thread, e: Entry, threads: dict[str, Thread], index: dict[str, Entry]) -> str | None:
    addr = e.addr(t.id)
    if e.kind == "Q" and effective_state(e) == "open" and addr in answered_set(threads):
        return "answered"
    if e.kind == "D" and e.state == "accepted" and addr in superseded_set(threads):
        return "superseded"
    if e.kind == "T" and e.state in ("todo", "landed"):
        held = [n for n in e.refs.get("needs", []) if n in index and index[n].state not in TERMINAL_T]
        if held:
            return "blocked（等 " + "、".join(held) + "）"
    return None


def build_index(threads: dict[str, Thread]) -> dict[str, Entry]:
    return {e.addr(t.id): e for t, e in all_entries(threads)}


def thread_active(t: Thread, threads: dict[str, Thread]) -> bool:
    answered = answered_set(threads)
    return any(is_open(e, e.addr(t.id), answered) for e in t.entries)


# --------------------------------------------------------------------------- 檔案與設定


def resolve_root(arg: str | None) -> Path:
    raw = arg or os.environ.get("DOCKET_ROOT")
    return Path(raw).resolve() if raw else Path(__file__).resolve().parent


def load_tz(root: Path) -> timezone:
    cfg = root / "docket.toml"
    offset = None
    if cfg.exists():
        offset = tomllib.loads(cfg.read_text(encoding="utf-8")).get("timezone")
    if offset is None:
        return datetime.now().astimezone().tzinfo  # type: ignore[return-value]
    m = re.fullmatch(r"([+-])(\d\d):(\d\d)", str(offset))
    if not m:
        raise DocketError(f"docket.toml 的 timezone 必須是 +HH:MM 或 -HH:MM，不是 {offset!r}")
    delta = timedelta(hours=int(m.group(2)), minutes=int(m.group(3)))
    return timezone(delta if m.group(1) == "+" else -delta)


def now(tz: timezone) -> datetime:
    fixed = os.environ.get("DOCKET_NOW")
    if fixed:
        return datetime.fromisoformat(fixed).replace(tzinfo=tz)
    return datetime.now(tz)


def fmt_ts(dt: datetime) -> str:
    return dt.isoformat(sep=" ", timespec="seconds")


def scan(root: Path) -> dict[str, str]:
    return {
        p.name: p.read_text(encoding="utf-8")
        for p in sorted(root.iterdir())
        if p.is_file() and FILE_RE.match(p.name)
    }


def atomic_write(path: Path, text: str) -> None:
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".docket-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as f:
            f.write(text)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def commit_texts(root: Path, changes: dict[str, str]) -> Analysis:
    """套用 `changes`（檔名 → 新內容）；若會產生**新的**錯誤就拒絕。"""
    before = scan(root)
    after = {**before, **changes}
    old = {c for c in analyze(before).errors}
    result = analyze(after)
    fresh = [c for c in result.errors if c not in old]
    if fresh:
        raise DocketError("寫入被拒絕，會產生新的衝突：\n" + "\n".join(c.line() for c in fresh))
    for name, text in changes.items():
        atomic_write(root / name, text)
    return result


# --------------------------------------------------------------------------- 驗證輸入


def check_text(text: str, what: str) -> str:
    if not text.strip():
        raise DocketError(f"{what}不能是空的")
    for line in text.split("\n"):
        if line.startswith(("# ", "## ", "### ")) or line.strip() == HISTORY_MARK:
            raise DocketError(f"{what}不能含有 `#`、`##`、`###` 開頭的行或 {HISTORY_MARK}（小標題請用 ####）：{line!r}")
    return text.strip("\n")


def check_title(title: str) -> str:
    if not title.strip() or "\n" in title:
        raise DocketError("--title 必須是單行、非空")
    return title.strip()


def check_addrs(values: list[str] | None, flag: str) -> list[str]:
    out = list(values or [])
    for v in out:
        if not ADDR_RE.match(v):
            raise DocketError(f"{flag} 的值必須是 `<thread>#<n>`，不是 {v!r}")
    return out


def parse_addr(addr: str) -> tuple[str, int]:
    m = ADDR_RE.match(addr)
    if not m:
        raise DocketError(f"{addr!r} 不是位址，格式是 `202610140516_slug#3`")
    return m.group(1), int(m.group(2))


def load_thread(root: Path, thread_id: str) -> Thread:
    name = f"{thread_id}.md"
    path = root / name
    if not path.exists():
        raise DocketError(f"找不到 thread：{thread_id}")
    try:
        return parse(path.read_text(encoding="utf-8"), thread_id)
    except ParseError as exc:
        raise DocketError(f"{name} 無法解析（先跑 check）：{exc}") from None


def find_entry(thread: Thread, n: int, addr: str) -> Entry:
    if not 1 <= n <= len(thread.entries):
        raise DocketError(f"{addr} 不存在（這個 thread 有 {len(thread.entries)} 個條目）")
    return thread.entries[n - 1]


def read_stdin(what: str) -> str:
    return check_text(sys.stdin.read(), what)


def stamp_after_last(thread: Thread, dt: datetime) -> str:
    ts = fmt_ts(dt)
    if thread.entries:
        last = max(datetime.fromisoformat(e.ts) for e in thread.entries)
        if dt < last:
            raise DocketError(f"系統時間 {ts} 早於這個 thread 的最後一個條目，拒絕寫入（時間戳必須不遞減）")
    return ts


# --------------------------------------------------------------------------- 指令


def cmd_new(root: Path, a: argparse.Namespace) -> int:
    if not SLUG_RE.match(a.slug):
        raise DocketError("slug 只能含小寫英數字與連字號")
    dt = now(load_tz(root))
    tid = f"{dt:%Y%m%d%H%M}_{a.slug}"
    if (root / f"{tid}.md").exists():
        raise DocketError(f"thread 已存在：{tid}")
    if a.prev is not None and not THREAD_RE.match(a.prev):
        raise DocketError("--prev 必須是 thread id")
    thread = Thread(id=tid, prev=a.prev, spec=SPEC, topic=check_text(a.topic, "--topic"))
    commit_texts(root, {f"{tid}.md": render(thread)})
    print(f"[docket] 已建立 {tid}")
    return 0


def cmd_add(root: Path, a: argparse.Namespace) -> int:
    kind = a.kind.upper()
    fields = {
        "answers": check_addrs(a.answers, "--answers"),
        "supersedes": check_addrs(a.supersedes, "--supersedes"),
        "needs": check_addrs(a.needs, "--needs"),
        "basis": check_addrs(a.basis, "--basis"),
    }
    for key, values in fields.items():
        if values and key not in ALLOWED_FIELDS[kind]:
            raise DocketError(f"類型 {kind} 不能有 --{key}")
    thread = load_thread(root, a.thread)
    dt = now(load_tz(root))
    ts = stamp_after_last(thread, dt)
    entry = Entry(
        n=len(thread.entries) + 1,
        kind=kind,
        ts=ts,
        title=check_title(a.title),
        body=read_stdin("正文"),
        refs={k: v for k, v in fields.items() if v},
    )
    if kind == "D":
        entry.state = "proposed"
    elif kind == "T":
        entry.state = "todo"
        entry.history.append(Hist(ts[:16], "todo", "建立"))
    thread.entries.append(entry)
    commit_texts(root, {f"{thread.id}.md": render(thread)})
    print(f"[docket] 已新增 {entry.addr(thread.id)}")
    return 0


def cmd_set(root: Path, a: argparse.Namespace) -> int:
    tid, n = parse_addr(a.addr)
    thread = load_thread(root, tid)
    e = find_entry(thread, n, a.addr)
    if e.kind == "O":
        raise DocketError("O 沒有狀態")
    if a.state not in STATES[e.kind]:
        raise DocketError(f"{e.kind} 的 state 必須是 {'／'.join(STATES[e.kind])}")
    current = effective_state(e)
    if a.state not in TRANSITIONS[e.kind].get(current or "", set()):
        raise DocketError(f"{e.kind} 不能從 {current} 轉成 {a.state}")
    needs_source = a.state in SOURCE_STATES
    if needs_source and not a.source:
        raise DocketError(f"→ {a.state} 必須帶 --source \"human: <名字> · 「<原話>」\"")
    if a.source and not needs_source:
        raise DocketError(f"→ {a.state} 不需要 --source")
    if a.source and not SOURCE_RE.match(a.source):
        raise DocketError("--source 格式必須是 `human: <名字> · 「<原話>」`")
    if a.to and a.state != "handed-off":
        raise DocketError("--to 只用於 handed-off")
    if a.state == "handed-off" and not a.to:
        raise DocketError("handed-off 必須用 --to 指名承接的 T")
    if (a.note or a.ref) and e.kind != "T":
        raise DocketError("--note／--ref 只用於 T 的沿革")

    dt = now(load_tz(root))
    ts = stamp_after_last(thread, dt)
    if e.kind == "Q" and a.state == "open":
        raise DocketError("Q 沒有轉回 open 的路")
    e.state = a.state
    if needs_source:
        e.source = a.source
    if a.to:
        e.refs["handoff"] = check_addrs([a.to], "--to")
    if e.kind == "T":
        text = a.note or ""
        refs = check_addrs(a.ref, "--ref")
        if refs:
            text = (text + " " if text else "") + "→ " + "、".join(refs)
        e.history.append(Hist(ts[:16], a.state, text or None))
    commit_texts(root, {f"{tid}.md": render(thread)})
    print(f"[docket] {a.addr} → {a.state}")
    return 0


def cmd_note(root: Path, a: argparse.Namespace) -> int:
    tid, n = parse_addr(a.addr)
    thread = load_thread(root, tid)
    e = find_entry(thread, n, a.addr)
    if e.kind != "T":
        raise DocketError("note 只用於 T 的沿革")
    if not NOTE_KIND_RE.match(a.kind) or a.kind in STATES["T"] or a.kind == "rewrite":
        raise DocketError("kind 必須是小寫英文單字，且不能與 T 的狀態名或 rewrite 相同")
    if "\n" in a.text or not a.text.strip():
        raise DocketError("沿革文字必須是單行、非空")
    ts = stamp_after_last(thread, now(load_tz(root)))
    e.history.append(Hist(ts[:16], a.kind, a.text.strip()))
    commit_texts(root, {f"{tid}.md": render(thread)})
    print(f"[docket] 已在 {a.addr} 的沿革追加 {a.kind}")
    return 0


def cmd_rewrite(root: Path, a: argparse.Namespace) -> int:
    tid, n = parse_addr(a.addr)
    thread = load_thread(root, tid)
    e = find_entry(thread, n, a.addr)
    if e.kind != "T":
        raise DocketError("rewrite 只能用於 T；D 與 O 不可變")
    ts = stamp_after_last(thread, now(load_tz(root)))
    e.body = read_stdin("正文")
    e.history.append(Hist(ts[:16], "rewrite"))
    commit_texts(root, {f"{tid}.md": render(thread)})
    print(f"[docket] 已重寫 {a.addr} 的正文")
    return 0


def cmd_append(root: Path, a: argparse.Namespace) -> int:
    tid, n = parse_addr(a.addr)
    thread = load_thread(root, tid)
    e = find_entry(thread, n, a.addr)
    if e.kind != "Q":
        raise DocketError("append 只能用於 Q；D 與 O 不可變，T 請用 rewrite")
    ts = stamp_after_last(thread, now(load_tz(root)))
    e.body = f"{e.body}\n\n**補充 {ts[:16]}**\n\n{read_stdin('補充')}"
    commit_texts(root, {f"{tid}.md": render(thread)})
    print(f"[docket] 已在 {a.addr} 追加補充")
    return 0


def load_clean(root: Path) -> Analysis:
    return analyze(scan(root))


def open_rows(threads: dict[str, Thread]):
    index = build_index(threads)
    answered = answered_set(threads)
    for t, e in all_entries(threads):
        addr = e.addr(t.id)
        if not is_open(e, addr, answered):
            continue
        yield t, e, addr, derived_label(t, e, threads, index)


def cmd_queue(root: Path, a: argparse.Namespace) -> int:
    threads = load_clean(root).threads
    rows = []
    for t, e, addr, _ in open_rows(threads):
        waiting = (e.kind == "Q") or (e.kind == "D" and e.state == "proposed") or (e.kind == "T" and e.state == "landed")
        if waiting:
            rows.append((addr, e.kind, effective_state(e), e.title))
    if not rows:
        print("（沒有等你的事）")
        return 0
    w = max(len(r[0]) for r in rows)
    for addr, kind, state, title in rows:
        print(f"{addr.ljust(w)}  {kind}  {state:9}  {title}")
    return 0


def render_head(threads: dict[str, Thread]) -> str:
    out = ["# Docket — HEAD", "", "<!-- Generated by docket.py index — do not hand-edit. -->", "", "## 現在開著的", ""]
    rows = list(open_rows(threads))
    if not rows:
        out.append("（沒有開著的條目）")
    for t, e, addr, label in rows:
        line = f"- `{addr}` · {e.kind} **{effective_state(e)}**"
        if label:
            line += f"（{label}）"
        out.append(f"{line} — {e.title}")
    out += ["", "## 進行中的 thread（id 降序）", ""]
    active = [t for t in sorted(threads.values(), key=lambda t: t.id, reverse=True) if thread_active(t, threads)]
    if not active:
        out.append("（無）")
    for t in active:
        answered = answered_set(threads)
        count = sum(1 for e in t.entries if is_open(e, e.addr(t.id), answered))
        first = t.topic.split("\n", 1)[0]
        out.append(f"- [{t.id}](./{t.id}.md) — {first}（未結束 {count}）")
    return "\n".join(out) + "\n"


def cmd_index(root: Path, a: argparse.Namespace) -> int:
    result = load_clean(root)
    if result.errors:
        print("\n".join(c.line() for c in result.errors), file=sys.stderr)
        raise DocketError("有衝突，不更新 head.md")
    text = render_head(result.threads)
    head = root / "head.md"
    if head.exists() and head.read_text(encoding="utf-8") == text:
        print("[docket] head.md 已是最新")
    else:
        atomic_write(head, text)
        print("[docket] head.md 已更新")
    return 0


def cmd_show(root: Path, a: argparse.Namespace) -> int:
    result = load_clean(root)
    tid, n = parse_addr(a.addr)
    thread = result.threads.get(tid)
    if thread is None:
        raise DocketError(f"找不到 thread（或它無法解析，先跑 check）：{tid}")
    e = find_entry(thread, n, a.addr)
    index = build_index(result.threads)
    label = derived_label(thread, e, result.threads, index)

    out = [f"# {a.addr} — {e.kind} · {e.title}", "", f"`{tid}` · {e.ts}", ""]
    state = effective_state(e)
    if state:
        out.append(f"- **state:** {state}" + (f"（推導：{label}）" if label else ""))
    for key in REF_FIELDS:
        if e.refs.get(key):
            out.append(f"- **{key}:** " + "、".join(e.refs[key]))
    if e.source:
        out.append(f"- **source:** {e.source}")
    taken = [x.addr(t.id) for t, x in all_entries(result.threads) if e.kind == "T" and a.addr in x.refs.get("handoff", [])]
    if taken:
        out.append("- **承接自:** " + "、".join(taken))
    out += ["", e.body]

    superseded = superseded_set(result.threads)
    cited: list[str] = []
    for key in ("basis", "answers", "supersedes", "needs"):
        cited += [x for x in e.refs.get(key, []) if x not in cited]
    if cited:
        out += ["", "## 依據與關聯", ""]
        for target in cited:
            ref = index.get(target)
            if ref is None:
                out.append(f"### {target} ⚠ 找不到")
                continue
            note = "（已被取代）" if target in superseded else ""
            out += [f"### {target} · {ref.kind} · {ref.title}{note}", "", ref.body, ""]
    out += ["", "## 這個 thread 的主題", "", thread.topic]
    if e.kind == "T":
        if a.history:
            out += ["", "## 沿革", ""] + [f"- {h.ts} {h.kind}" + (f" —— {h.text}" if h.text else "") for h in e.history]
        elif e.history:
            out += ["", "---", f"沿革 {len(e.history)} 條未顯示 —— `--history` 看全部。"]
    print("\n".join(out).rstrip("\n"))
    return 0


def hook_should_run(root: Path) -> bool:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return False
    tool_input = payload.get("tool_input") or {}
    raw = tool_input.get("file_path") or ""
    if not raw:
        return False
    path = Path(raw).resolve()
    return path.parent == root and (FILE_RE.match(path.name) is not None or path.name == "head.md")


def cmd_check(root: Path, a: argparse.Namespace) -> int:
    if a.hook and not hook_should_run(root):
        return 0
    result = load_clean(root)
    if not result.conflicts:
        if not a.hook:
            print(f"[docket] 乾淨（{len(result.threads)} 個 thread）")
        return 0
    text = "\n".join(c.line() for c in result.conflicts)
    if a.hook:
        print(text, file=sys.stderr)
        return 2 if result.errors else 0
    print(text)
    return 1 if result.errors else 0


# --------------------------------------------------------------------------- CLI


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="docket.py", description="docket v1")
    p.add_argument("--root", help="紀錄根目錄")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("new")
    s.add_argument("slug")
    s.add_argument("--topic", required=True)
    s.add_argument("--prev")
    s.set_defaults(fn=cmd_new)

    s = sub.add_parser("add")
    s.add_argument("thread")
    s.add_argument("kind", choices=["q", "d", "o", "t", "Q", "D", "O", "T"])
    s.add_argument("--title", required=True)
    for flag in ("answers", "supersedes", "needs", "basis"):
        s.add_argument(f"--{flag}", nargs="+")
    s.set_defaults(fn=cmd_add)

    s = sub.add_parser("set")
    s.add_argument("addr")
    s.add_argument("state")
    s.add_argument("--source")
    s.add_argument("--to")
    s.add_argument("--note")
    s.add_argument("--ref", nargs="+")
    s.set_defaults(fn=cmd_set)

    s = sub.add_parser("note")
    s.add_argument("addr")
    s.add_argument("kind")
    s.add_argument("text")
    s.set_defaults(fn=cmd_note)

    for name, fn in (("rewrite", cmd_rewrite), ("append", cmd_append)):
        s = sub.add_parser(name)
        s.add_argument("addr")
        s.set_defaults(fn=fn)

    sub.add_parser("queue").set_defaults(fn=cmd_queue)
    sub.add_parser("index").set_defaults(fn=cmd_index)

    s = sub.add_parser("show")
    s.add_argument("addr")
    s.add_argument("--history", action="store_true")
    s.set_defaults(fn=cmd_show)

    s = sub.add_parser("check")
    s.add_argument("--hook", action="store_true")
    s.set_defaults(fn=cmd_check)
    return p


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    args = build_parser().parse_args(argv)
    root = resolve_root(args.root)
    try:
        if not root.is_dir():
            raise DocketError(f"根目錄不存在：{root}")
        return args.fn(root, args)
    except DocketError as exc:
        print(f"[docket] {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
