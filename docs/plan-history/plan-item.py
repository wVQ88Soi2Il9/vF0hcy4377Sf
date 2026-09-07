#!/usr/bin/env python3
"""Read **one item** out of a plan, instead of reading the whole plan.

Stdlib only — no venv needed. Parsing is `plan_parse.py`, shared with
`update-head.py`, so this tool cannot disagree with the checker about what a plan says.

    plan-item.py 0011#5             # the item, its plan header, and its evidence
    plan-item.py 0011#5 --history   # + every history entry and every related observation
    plan-item.py --list             # every open item across live plans

The default view is what you need in order to *work on* the item: what is owed, what
it rests on, and the constraints that bind it. History is deliberately omitted —
the body is already the present, and replaying how it got there costs tokens that the task
does not need.

There is no view between the two. A healthy item's history is at most eight lines, so
filtering it would optimise something that is not scarce; `supersedes H<n>` therefore only
marks an entry in `--history`, and no behaviour depends on whether it was written.

Exit codes: 0 ok · 2 bad address / not found.
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
        return [f"### O{num} — (Observation not found in this plan)", ""]
    head = obs.heading
    for kind, sources in obs.inbound.items():
        who = ", ".join(f"O{n}" for n in sources)
        label_map = {
            "corrects": f"Fact was corrected by {who}, do not cite further",
            "overturns": f"Inference was overturned by {who}",
            "updates": f"Updated by {who}, valid only for its own timestamp",
        }
        head += "  ⚠ " + label_map.get(kind, f"Referenced by {who}")
    return [head, *trimmed(obs.lines), ""]


def render_item(plan: Plan, item: Item, index: dict[str, Item], mode: str) -> list[str]:
    out = [f"# {item.addr} — {item.title}", ""]
    out.append(f"`{plan.stem}` · plan status `{plan.status}`")
    out += ["", "## Plan Header", *trimmed(plan.summary)]

    out += ["", "## Task Item", ""]
    out.append(f"- **state:** {display_state(item, index)}" + (
        f" ({item.state})" if display_state(item, index) != item.state else ""
    ))
    for label, addrs in (("needs", item.needs), ("handoff", item.handoff), ("claims", item.claims)):
        if not addrs:
            continue
        parts = []
        for a in addrs:
            target = index.get(a)
            parts.append(f"`{a}` ({target.state})" if target else f"`{a}` ⚠ not found")
        out.append(f"- **{label}:** " + ", ".join(parts))
    if item.basis:
        out.append("- **basis:** → " + ", ".join(f"O{n}" for n in item.basis))
    if held := blockers(item, index):
        out.append("- **blocking it:** " + ", ".join(f"`{a}`" for a in held))
    out += ["", *trimmed(item.body)]

    if mode == "history":
        dead = {n for h in item.history for n in h.supersedes}
        out += ["", "## History (All)", ""]
        for h in item.history:
            out.append(h.line + ("  ⚠ superseded" if h.num in dead else ""))
        if not item.history:
            out.append("(No history entries)")

    cited = list(item.basis)
    if mode == "history":
        for h in item.history:
            cited += h.obs_refs
        for num in list(cited):
            if obs := plan.observations.get(num):
                for group in (*obs.relations.values(), *obs.inbound.values()):
                    cited += group
    seen: list[int] = []
    for num in cited:
        if num not in seen:
            seen.append(num)

    if seen:
        label = "All Related Observations" if mode == "history" else "Basis"
        out += ["", f"## {label} ({len(seen)} items)", ""]
        for num in sorted(seen):
            out += obs_block(plan, num)

    if mode == "default" and item.history:
        out += [
            "",
            "---",
            f"{len(item.history)} history entries hidden —— use `--history` to view all.",
        ]
    return out


def render_list(plans: list[Plan]) -> list[str]:
    index = item_index(plans)
    live = sorted(
        (p for p in plans if p.status in LIVE_STATUSES),
        key=lambda p: p.seq,
        reverse=True,
    )
    rows = [(p, it) for p in live for it in p.items if it.is_open]
    if not rows:
        return ["(No open items)"]

    aw = max(width(it.addr) for _, it in rows)
    sw = max(width(display_state(it, index)) for _, it in rows)
    out = []
    for _, it in rows:
        line = f"{pad(it.addr, aw)}  {pad(display_state(it, index), sw)}  {it.title}"
        if held := blockers(it, index):
            line += " (waiting for " + ", ".join(held) + ")"
        out.append(line)
    return out


def main(argv: list[str]) -> int:
    force_utf8_stdio()
    args = [a for a in argv if not a.startswith("--")]
    flags = {a for a in argv if a.startswith("--")}
    if unknown := flags - {"--history", "--list"}:
        return die(f"[plan-item] Unrecognized option: {' '.join(sorted(unknown))}")

    report = collect()

    if "--list" in flags:
        print("\n".join(render_list(report.plans)))
        return 0

    if len(args) != 1:
        return die(
            "[plan-item] Usage: plan-item.py <seq>#<n> [--history]",
            "            or     plan-item.py --list",
        )

    addr = args[0]
    if not (m := ADDR_RE.fullmatch(addr)):
        return die(f"[plan-item] {addr!r} is not a valid address format (expected `0011#5`).")

    seq = m.group(1)
    plans = {p.seq: p for p in report.plans}
    plan = plans.get(seq)
    if plan is None:
        return die(f"[plan-item] Plan seq {seq} not found.")

    index = item_index(report.plans)
    item = index.get(addr)
    if item is None:
        have = ", ".join(str(it.num) for it in plan.items) or "(none)"
        return die(f"[plan-item] {plan.stem} does not have item #{m.group(2)}. Available: {have}")

    mode = "history" if "--history" in flags else "default"
    print("\n".join(render_item(plan, item, index, mode)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
