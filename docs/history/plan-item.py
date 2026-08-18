#!/usr/bin/env python3
"""Read **one item** out of a plan, instead of reading the whole plan.

Stdlib only — no venv needed. Parsing is `plan_parse.py`, shared with
`update-head.py`, so this tool cannot disagree with the checker about what a plan says.

    plan-item.py 0011#5             # the item, its plan header, and its evidence
    plan-item.py 0011#5 --history   # + every 沿革 entry and every related observation
    plan-item.py --list             # every open item across the live v3 plans

The default view is what you need in order to *work on* the item: what is owed, what
it rests on, and the constraints that bind it. History is deliberately not in it —
正文 is already the present, and replaying how it got there costs tokens that the task
does not need.

There is no view between the two. A healthy item's 沿革 is at most eight lines, so
filtering it would optimise something that is not scarce; `取代 H<n>` therefore only
*marks* an entry in `--history`, and no behaviour depends on whether it was written.

**v3 only.** Earlier plans have no addressable items; asking for one is an error rather
than a degraded answer, because a partial answer about a plan is worse than none.

Exit codes: 0 ok · 2 bad address / not found / not v3.
"""

from __future__ import annotations

import sys
import unicodedata

from plan_parse import (
    ADDR_RE,
    LIVE_STATUSES,
    ROOT_DISPLAY,
    Item,
    Observation,
    Plan,
    blockers,
    collect,
    display_state,
    force_utf8_stdio,
    item_index,
)


def die(*msg: str) -> int:
    for line in msg:
        print(line, file=sys.stderr)
    return 2


def width(text: str) -> int:
    return sum(2 if unicodedata.east_asian_width(c) in "WF" else 1 for c in text)


def pad(text: str, to: int) -> str:
    return text + " " * max(0, to - width(text))


def trimmed(lines: list[str]) -> list[str]:
    out = list(lines)
    while out and not out[-1].strip():
        out.pop()
    return out


def obs_block(plan: Plan, num: int) -> list[str]:
    obs: Observation | None = plan.observations.get(num)
    if obs is None:
        return [f"### O{num} — （這份計畫裡沒有這條觀察）", ""]
    head = obs.heading
    for kind, sources in obs.inbound.items():
        who = "、".join(f"O{n}" for n in sources)
        head += "  ⚠ " + {
            "更正": f"事實已被 {who} 更正,不可再引用",
            "推翻": f"推論已被 {who} 推翻",
            "更新": f"已由 {who} 更新,只對它自己的時刻成立",
        }[kind]
    return [head, *trimmed(obs.lines), ""]


def render_item(plan: Plan, item: Item, index: dict[str, Item], mode: str) -> list[str]:
    out = [f"# {item.addr} — {item.title}", ""]
    out.append(f"`{plan.stem}` · plan status `{plan.status}`")
    out += ["", "## 這份計畫（檔頭）", *trimmed(plan.summary)]

    out += ["", "## 這一格", ""]
    out.append(f"- **state:** {display_state(item, index)}" + (
        f"（{item.state}）" if display_state(item, index) != item.state else ""
    ))
    for label, addrs in (("needs", item.needs), ("移交", item.handoff), ("承接", item.claims)):
        if not addrs:
            continue
        parts = []
        for a in addrs:
            target = index.get(a)
            parts.append(f"`{a}`（{target.state}）" if target else f"`{a}` ⚠ 找不到")
        out.append(f"- **{label}:** " + "、".join(parts))
    if item.basis:
        out.append("- **basis:** → " + "、".join(f"O{n}" for n in item.basis))
    if held := blockers(item, index):
        out.append("- **擋住它的:** " + "、".join(f"`{a}`" for a in held))
    out += ["", *trimmed(item.body)]

    if mode == "history":
        dead = {n for h in item.history for n in h.supersedes}
        out += ["", "## 沿革（全部）", ""]
        for h in item.history:
            out.append(h.line + ("  ⚠ 已被取代" if h.num in dead else ""))
        if not item.history:
            out.append("（沒有沿革）")

    cited = list(item.basis)
    if mode == "history":
        for h in item.history:
            cited += h.obs_refs
        for num in list(cited):  # follow every relation, in both directions
            if obs := plan.observations.get(num):
                for group in (*obs.relations.values(), *obs.inbound.values()):
                    cited += group
    seen: list[int] = []
    for num in cited:
        if num not in seen:
            seen.append(num)

    if seen:
        label = "全部相關觀察" if mode == "history" else "依據"
        out += ["", f"## {label}（{len(seen)} 條）", ""]
        for num in sorted(seen):
            out += obs_block(plan, num)

    if mode == "default" and item.history:
        out += [
            "",
            "---",
            f"沿革 {len(item.history)} 條未顯示 —— `--history` 看全部。",
        ]
    return out


def render_list(plans: list[Plan]) -> list[str]:
    index = item_index(plans)
    live = sorted(
        (p for p in plans if p.status in LIVE_STATUSES and p.version >= 3),
        key=lambda p: p.seq,
        reverse=True,
    )
    rows = [(p, it) for p in live for it in p.items if it.is_open]
    if not rows:
        legacy = [p.seq for p in plans if p.status in LIVE_STATUSES and p.version < 3]
        note = f"活著的計畫都是 v3 之前的（{'、'.join(legacy)}），要開檔才知道。" if legacy else ""
        return ["（沒有開著的項目）", note] if note else ["（沒有開著的項目）"]

    aw = max(width(it.addr) for _, it in rows)
    sw = max(width(display_state(it, index)) for _, it in rows)
    out = []
    for _, it in rows:
        line = f"{pad(it.addr, aw)}  {pad(display_state(it, index), sw)}  {it.title}"
        if held := blockers(it, index):
            line += "（等 " + "、".join(held) + "）"
        out.append(line)
    return out


def main(argv: list[str]) -> int:
    force_utf8_stdio()
    args = [a for a in argv if not a.startswith("--")]
    flags = {a for a in argv if a.startswith("--")}
    if unknown := flags - {"--history", "--list"}:
        return die(f"[plan-item] 不認得的選項：{' '.join(sorted(unknown))}")

    report = collect()

    if "--list" in flags:
        print("\n".join(render_list(report.plans)))
        return 0

    if len(args) != 1:
        return die(
            "[plan-item] 用法：plan-item.py <seq>#<n> [--history]",
            "            或   plan-item.py --list",
        )

    addr = args[0]
    if not (m := ADDR_RE.fullmatch(addr)):
        return die(f"[plan-item] {addr!r} 不是一個位址，格式是 `0011#5`。")

    seq = m.group(1)
    plans = {p.seq: p for p in report.plans}
    plan = plans.get(seq)
    if plan is None:
        return die(f"[plan-item] 沒有 seq 為 {seq} 的計畫。")
    if plan.version < 3:
        return die(
            f"[plan-item] {plan.stem} 是 plan-history v{plan.version}，沒有可定址的格子。",
            "            v3 之前的計畫沒有逐格結構，本工具不做降級支援 ——",
            f"            要看它欠什麼，只能整份讀：{ROOT_DISPLAY}/{plan.name}",
        )

    index = item_index(report.plans)
    item = index.get(addr)
    if item is None:
        have = "、".join(str(it.num) for it in plan.items) or "（無）"
        return die(f"[plan-item] {plan.stem} 裡沒有第 {m.group(2)} 格。現有：{have}")

    mode = "history" if "--history" in flags else "default"
    print("\n".join(render_item(plan, item, index, mode)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
