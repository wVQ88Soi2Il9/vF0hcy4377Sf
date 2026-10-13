#!/usr/bin/env python3
"""只讀計畫裡的**一格**，不讀整份。

僅使用標準函式庫。解析在 `plan_parse.py`，與 `update-head.py` 共用，所以兩者不會對
「計畫寫了什麼」有不同看法。

    plan-item.py 0011#5             # 這一格、它的計畫檔頭、它的依據
    plan-item.py 0011#5 --history   # + 全部沿革與全部相關觀察
    plan-item.py --list             # 所有活著的計畫的開放項

預設檢視剛好夠「動手做這一格」：欠什麼、依據什麼、哪些約束綁著它。沿革不在其中 ——
正文已經是現在，重播它怎麼走到這裡只會花掉任務不需要的 token。中間沒有第三種檢視：
健康的格子沿革至多八行，過濾它是在最佳化不稀缺的東西。

結束碼：0 正常 · 2 位址錯誤／找不到。
"""

from __future__ import annotations

import sys
import unicodedata

from plan_parse import (
    ADDR_RE,
    LIVE_STATUSES,
    ROOT_DISPLAY,
    Item,
    Plan,
    blockers,
    claimed_by,
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
    obs = plan.observations.get(num)
    if obs is None:
        return [f"### O{num} — （這份計畫裡沒有這條觀察）", ""]
    return [obs.heading, *trimmed(obs.lines), ""]


def render_item(plan: Plan, item: Item, index: dict[str, Item], mode: str) -> list[str]:
    out = [f"# {item.addr} — {item.title}", ""]
    out.append(f"`{plan.stem}` · plan status `{plan.status}`")
    out += ["", "## 這份計畫（檔頭）", *trimmed(plan.summary)]

    state = display_state(item, index)
    out += ["", "## 這一格", ""]
    out.append(f"- **state:** {state}" + (f"（{item.state}）" if state != item.state else ""))

    def describe(addrs: list[str]) -> str:
        parts = []
        for a in addrs:
            target = index.get(a)
            parts.append(f"`{a}`（{target.state}）" if target else f"`{a}` ⚠ 找不到")
        return "、".join(parts)

    if item.needs:
        out.append("- **needs:** " + describe(item.needs))
    if item.handoff:
        out.append("- **移交:** " + describe(item.handoff))
    if taken := claimed_by(index).get(item.addr):
        out.append("- **承接自:** " + describe(taken))
    if item.basis:
        out.append("- **basis:** → " + "、".join(f"O{n}" for n in item.basis))
    if held := blockers(item, index):
        out.append("- **擋住它的:** " + "、".join(f"`{a}`" for a in held))
    out += ["", *trimmed(item.body)]

    cited = list(item.basis)
    if mode == "history":
        out += ["", "## 沿革（全部）", ""]
        out += [h.line for h in item.history] or ["（沒有沿革）"]
        for h in item.history:
            cited += h.obs_refs

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
        out += ["", "---", f"沿革 {len(item.history)} 條未顯示 —— `--history` 看全部。"]
    return out


def render_list(plans: list[Plan]) -> list[str]:
    index = item_index(plans)
    live = sorted((p for p in plans if p.status in LIVE_STATUSES), key=lambda p: p.seq, reverse=True)
    rows = [it for p in live for it in p.items if it.is_open]
    if not rows:
        return ["（沒有開著的項目）"]

    aw = max(width(it.addr) for it in rows)
    sw = max(width(display_state(it, index)) for it in rows)
    out = []
    for it in rows:
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

    plan = next((p for p in report.plans if p.seq == m.group(1)), None)
    if plan is None:
        return die(f"[plan-item] 沒有序號為 {m.group(1)} 的計畫（在 {ROOT_DISPLAY}/）。")

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
