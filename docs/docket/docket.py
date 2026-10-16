#!/usr/bin/env python3
"""docket: append-only facts and plans, one file per plan in log/. The only writer. Spec: README.md."""

import argparse
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
LOGDIR = os.path.join(HERE, "log")
ID_FMT = "%Y%m%d%H%M%S"
FACT_IS = ("true", "false", "replaced")
CLOSE_IS = ("solved", "unable", "invalid")
OPS = ("is", "needs+", "needs-", "rule")
PLAN_KEYS = ("need", "verify", "from")
FACT_KEYS = ("src", "check", "replaces")
LOGIC_KEYS = ("commit", "dirty", "exit")
TIMEOUT = 60
HEAD_RE = re.compile(r"^## (\d{14}) (plan|fact) ([\w:.-]+)$")
FIELD_RE = re.compile(r"^([a-z][a-z+-]*): (\S.*)$")


class DocketError(Exception):
    pass


def is_logic(by):
    return by == "logic"


def is_human(by):
    return by == "human" or by.startswith("human:")


# ---------- files ----------
# log/<plan id>.md holds a plan and every fact that belongs to it:
#   ## <id> <plan|fact> <by>
#   key: value          (one line each, optional)
#                       (blank line)
#   body                (optional, may span lines, no line starting with "## ")

def render_entry(e):
    s = f"## {e['id']} {e['kind']} {e['by']}\n" + "".join(f"{k}: {v}\n" for k, v in e["f"].items())
    return s + (f"\n{e['body']}\n" if e["body"] else "")


def parse_file(text, stem):
    where = f"log/{stem}.md"
    if not re.fullmatch(r"\d{14}", stem):
        raise DocketError(f"{where}: file name must be a plan id YYYYMMDDHHMMSS")
    chunks = re.split(r"(?m)^(?=## )", text)
    if chunks[0].strip():
        raise DocketError(f"{where}: text before the first entry")
    out = []
    for c in chunks[1:]:
        lines = c.split("\n")
        m = HEAD_RE.match(lines[0])
        if not m:
            raise DocketError(f"{where}: bad entry heading '{lines[0]}'")
        fields, n = {}, 1
        while n < len(lines) and FIELD_RE.match(lines[n]):
            k, v = FIELD_RE.match(lines[n]).groups()
            if k in fields:
                raise DocketError(f"{where}: {m[1]}: duplicate field '{k}'")
            fields[k] = v
            n += 1
        out.append({"id": m[1], "kind": m[2], "by": m[3], "f": fields,
                    "body": "\n".join(lines[n:]).strip(), "plan": stem})
    if not out or out[0]["kind"] != "plan" or out[0]["id"] != stem:
        raise DocketError(f"{where}: must start with plan {stem}")
    for a, b in zip(out, out[1:]):
        if b["kind"] == "plan" or b["id"] <= a["id"]:
            raise DocketError(f"{where}: {b['id']}: only the first entry is a plan, and ids must increase")
    return out


def log_files():
    return sorted(f for f in os.listdir(LOGDIR) if f.endswith(".md")) if os.path.isdir(LOGDIR) else []


def read_text(name):
    with open(os.path.join(LOGDIR, name), encoding="utf-8") as fh:
        return fh.read()


def read_entries():
    return [e for name in log_files() for e in parse_file(read_text(name), name[:-3])]


# ---------- state ----------

class State:
    """Replays entries in id order. Raises DocketError on any invalid entry."""

    def __init__(self, entries):
        self.e = {}
        for x in entries:
            if x["id"] in self.e:
                raise DocketError(f"{x['id']}: duplicate id")
            self.e[x["id"]] = x
        self.order = sorted(self.e)
        self.about = {i: [] for i in self.order}    # fact id -> later facts with is / replaces on it
        self.on_plan = {i: [] for i in self.order}  # plan id -> facts with on=plan
        self.value = {}                             # fact id -> (value, by, deciding id)
        self.plans = {}                             # plan id -> {"need": [...], "close": id | None}
        self.validate()
        self.compute_values()
        self.apply_plans()
        self.check_cycles()

    # --- structure (forward) ---

    def ref(self, x, v, what):
        if v not in self.e or v >= x["id"]:
            raise DocketError(f"{x['id']}: {what} must be an earlier id, got '{v}'")
        return v

    def kind(self, i):
        x = self.e[i]
        return "plan" if x["kind"] == "plan" else "on" if "on" in x["f"] else "fact"

    def is_close(self, i):
        x = self.e[i]
        return x["kind"] == "fact" and x["f"].get("is") in CLOSE_IS

    def validate(self):
        closed = set()
        for i in self.order:
            x = self.e[i]
            if x["kind"] == "plan":
                self.validate_plan(x)
            elif "on" in x["f"]:
                self.validate_on(x, closed)
            else:
                self.validate_fact(x, closed)

    def validate_plan(self, x):
        f = x["f"]
        if not x["body"] or is_logic(x["by"]):
            raise DocketError(f"{x['id']}: plan needs text and a non-logic author")
        if set(f) - set(PLAN_KEYS):
            raise DocketError(f"{x['id']}: unknown field on plan")
        self.need_list(x, f.get("need", ""))
        if "from" in f and self.kind(self.ref(x, f["from"], "from")) != "plan":
            raise DocketError(f"{x['id']}: from must target a plan")

    def validate_fact(self, x, closed):
        i, f = x["id"], x["f"]
        if not x["body"] or is_logic(x["by"]):
            raise DocketError(f"{i}: fact needs text and a non-logic author")
        if set(f) - set(FACT_KEYS):
            raise DocketError(f"{i}: unknown field on fact")
        if x["plan"] in closed:
            raise DocketError(f"{i}: plan {x['plan']} is closed; new facts go in an open plan")
        if "replaces" in f and self.kind(self.ref(x, f["replaces"], "replaces")) != "fact":
            raise DocketError(f"{i}: replaces must target a plain fact")

    def need_list(self, x, v):
        out = []
        for n in [s for s in v.split(",") if s]:
            if self.kind(self.ref(x, n, "need")) == "on":
                raise DocketError(f"{x['id']}: need must target a fact or plan")
            out.append(n)
        return out

    def validate_on(self, x, closed):
        i, f, by = x["id"], x["f"], x["by"]
        t = self.ref(x, f["on"], "on")
        if self.e[t]["plan"] != x["plan"]:
            raise DocketError(f"{i}: must live in the file of its target {t}")
        ops = [k for k in f if k != "on" and k not in LOGIC_KEYS]
        if len(ops) != 1 or ops[0] not in OPS:
            raise DocketError(f"{i}: needs exactly one of {' / '.join(OPS)}")
        op, v = ops[0], f[ops[0]]
        if is_logic(by) != ("commit" in f):
            raise DocketError(f"{i}: commit is required for, and only for, logic entries")
        if is_logic(by) and (op != "is" or not ({"check", "verify"} & set(self.e[t]["f"]))):
            raise DocketError(f"{i}: logic only reports `is`, and only on a target with check or verify")
        if self.kind(t) == "plan":
            if t in closed:
                raise DocketError(f"{i}: plan {t} is closed")
            if op == "is":
                if v not in CLOSE_IS:
                    raise DocketError(f"{i}: on a plan use is={'|'.join(CLOSE_IS)}")
                if not (is_logic(by) or is_human(by)):
                    raise DocketError(f"{i}: only logic (verify) or human may close a plan")
                closed.add(t)
            elif op in ("needs+", "needs-") and t in self.need_list(x, v):
                raise DocketError(f"{i}: plan cannot need itself")
            self.on_plan[t].append(i)
        else:
            if op != "is" or v not in FACT_IS:
                raise DocketError(f"{i}: on a fact use is={'|'.join(FACT_IS)}")
            if self.is_close(t):
                raise DocketError(f"{i}: a close is final; open a new plan with --from instead")
            self.about[t].append(i)

    # --- values (backward: a fact's value depends only on later facts) ---

    def compute_values(self):
        for i in self.order:
            x = self.e[i]
            if x["kind"] == "fact" and x["f"].get("replaces"):
                self.about[x["f"]["replaces"]].append(i)
        for i in reversed(self.order):
            if self.e[i]["kind"] != "fact":
                continue
            cands = [("true", self.e[i]["by"], i)]
            for y in self.about[i]:
                if self.value[y][0] != "true":
                    continue
                fy = self.e[y]["f"]
                cands.append(("replaced" if fy.get("replaces") == i else fy["is"], self.e[y]["by"], y))
            self.value[i] = max(cands, key=lambda c: (is_logic(c[1]), c[2]))

    def successor(self, i):
        """The newer fact that replaced i, or None (true, false, or replaced by nothing)."""
        v, _, d = self.value[i]
        return d if v == "replaced" and self.e[d]["f"].get("replaces") == i else None

    def holds(self, i):
        return self.value[i][0] == "true"

    # --- plans (forward) ---

    def apply_plans(self):
        for i in self.order:
            x = self.e[i]
            if x["kind"] != "plan":
                continue
            p = {"need": self.need_list(x, x["f"].get("need", "")), "close": None}
            for y in self.on_plan[i]:
                fy = self.e[y]["f"]
                if not self.holds(y):
                    continue
                if fy.get("is") in CLOSE_IS:
                    p["close"] = y
                elif "needs+" in fy:
                    p["need"] += [n for n in fy["needs+"].split(",") if n not in p["need"]]
                elif "needs-" in fy:
                    p["need"] = [n for n in p["need"] if n not in fy["needs-"].split(",")]
            self.plans[i] = p

    def check_cycles(self):
        state = {}

        def visit(i):
            state[i] = 1
            for n in self.plans[i]["need"]:
                if n in self.plans:
                    if state.get(n) == 1:
                        raise DocketError(f"need cycle through plan {n}")
                    if n not in state:
                        visit(n)
            state[i] = 2
        for i in self.plans:
            if i not in state:
                visit(i)

    # --- views ---

    def resolve(self, ref):
        ref = ref.lstrip("#")
        if ref in self.e:
            return ref
        hits = [i for i in self.e if i.endswith(ref)]
        if len(hits) != 1:
            raise DocketError(f"'{ref}' matches {len(hits)} ids")
        return hits[0]

    def plan_status(self, i):
        c = self.plans[i]["close"]
        return "open" if c is None else self.e[c]["f"]["is"]

    def flag(self, i):
        if i in self.plans:
            s = self.plan_status(i)
            return "…" if s == "open" else " " if s == "solved" else "!"
        v, by, _ = self.value[i]
        return "!" if v != "true" else " " if is_logic(by) else "?"

    def label(self, i):
        if i in self.plans:
            c = self.plans[i]["close"]
            return "open" if c is None else f"{self.plan_status(i)} · {self.e[c]['by']}"
        v, by, d = self.value[i]
        if self.successor(i):
            return f"replaced by {d}"
        return f"{v} · " + ("logic" if is_logic(by) else f"unverified:{by}")

    def title(self, i):
        first, *more = self.e[i]["body"].split("\n")
        return first + (" ..." if more else "")

    def line(self, i, row=False):
        """row=True: a plan listed on its own, flagged by its needs; else flagged as a need."""
        f = self.e[i]["f"]
        g = self.flag(i)
        if row and i in self.plans:
            g = self.worst(self.plans[i]["need"]) if self.plan_status(i) == "open" else " "
        s = f"{g} {'P' if i in self.plans else 'F'} {i} [{self.label(i)}] {self.title(i)}"
        if f.get("src"):
            s += f"  (src: {f['src']})"
        c = self.plans.get(i, {}).get("close")
        if c and self.e[c]["body"]:
            s += f"  — {self.e[c]['body'].splitlines()[0]}"
        return s

    def worst(self, needs):
        flags = {self.flag(n) for n in needs}
        return next((g for g in "!…?" if g in flags), " ")

    def ready(self, i):
        return self.plan_status(i) == "open" and self.worst(self.plans[i]["need"]) in " ?"

    def last_logic(self, i):
        ys = [y for y in self.about[i] if is_logic(self.e[y]["by"])]
        return self.e[ys[-1]]["f"]["is"] if ys else None

    def rules_for(self, i):
        """Rules that hold for plan i: its own, and those of open plans that (transitively) need it."""
        out, seen, stack = [], set(), [i]
        while stack:
            p = stack.pop()
            if p in seen:
                continue
            seen.add(p)
            if p == i or self.plan_status(p) == "open":
                out += [y for y in self.on_plan[p] if "rule" in self.e[y]["f"] and self.holds(y)]
            stack += [q for q in self.plans if p in self.plans[q]["need"]]
        return sorted(out)


def summary(e):
    s = f"{e['id']} {e['by']} " + " ".join(f"{k}={v}" for k, v in e["f"].items())
    return s + (f" — {e['body'].splitlines()[0]}" if e["body"] else "")


# ---------- write ----------

def new_id(st):
    now = datetime.now(timezone.utc).replace(microsecond=0)
    if st.order:
        last = datetime.strptime(st.order[-1], ID_FMT).replace(tzinfo=timezone.utc)
        if now <= last:
            now = last + timedelta(seconds=1)
    return now.strftime(ID_FMT)


def write(st, by, kind, fields, body="", plan=None, echo=True):
    """Append one entry to the file of `plan` (a new plan creates its own file)."""
    if not by or not re.fullmatch(r"[\w:.-]+", by):
        raise DocketError("--by (or DOCKET_BY) required: one token, e.g. human, human:ann, claude")
    for k, v in fields.items():
        if not str(v).strip() or "\n" in str(v):
            raise DocketError(f"{k}: must be one non-empty line")
    body = (body or "").strip()
    if any(l.startswith("## ") for l in body.split("\n")):
        raise DocketError("text: a line may not start with '## '")
    i = new_id(st)
    e = {"id": i, "kind": kind, "by": by, "f": {k: str(v).strip() for k, v in fields.items()},
         "body": body, "plan": i if kind == "plan" else plan}
    st = State(list(st.e.values()) + [e])
    os.makedirs(LOGDIR, exist_ok=True)
    path = os.path.join(LOGDIR, e["plan"] + ".md")
    if kind == "plan":
        with open(path, "x", encoding="utf-8") as fh:
            fh.write(render_entry(e))
    else:
        with open(path, "a", encoding="utf-8") as fh:
            fh.write("\n" + render_entry(e))
    if echo:
        print(i)
    return st


def claim_author(a):
    if is_logic(a.by or ""):
        raise DocketError("'logic' is written only by the tool (recheck, verify)")
    return a.by


# ---------- logic ----------

def git(root, *args):
    r = subprocess.run(["git", "-C", root, *args], capture_output=True, text=True, encoding="utf-8")
    return r.stdout.strip() if r.returncode == 0 else None


def run_logic(cmd):
    root = git(HERE, "rev-parse", "--show-toplevel") or HERE
    try:
        r = subprocess.run(cmd, shell=True, cwd=root, capture_output=True, text=True, encoding="utf-8", timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        raise DocketError(f"timeout after {TIMEOUT}s: {cmd}")
    fields = {"commit": git(root, "rev-parse", "--short", "HEAD") or "none"}
    if git(root, "status", "--porcelain", "--", ".", f":(exclude){os.path.relpath(LOGDIR, root)}"):
        fields["dirty"] = "1"
    if r.returncode != 0:
        fields["exit"] = str(r.returncode)
        sys.stderr.write((r.stdout + r.stderr)[-2000:])
    return r.returncode == 0, fields


def recheck(st, ids, out=sys.stdout):
    for i in ids:
        ok, extra = run_logic(st.e[i]["f"]["check"])
        prev = st.last_logic(i)
        now = "true" if ok else "replaced" if prev in ("true", "replaced") else "false"
        print(f"{i}: {now}" + ("" if now != prev else " (unchanged)"), file=out)
        if now != prev:
            st = write(st, "logic", "fact", {"on": i, "is": now, **extra}, plan=st.e[i]["plan"], echo=False)
    return st


# ---------- commands ----------

def target(st, ref, plan_only=False):
    t = st.resolve(ref)
    if plan_only and t not in st.plans:
        raise DocketError(f"{t}: not a plan")
    return t


def cmd_fact(st, a):
    f = {k: v for k, v in (("src", a.src), ("check", a.check)) if v}
    plan = None
    if a.replaces:
        f["replaces"] = st.resolve(a.replaces)
        plan = st.e[f["replaces"]]["plan"]
    if a.in_:
        plan = target(st, a.in_, plan_only=True)
    if not plan:
        raise DocketError("--in PLAN required: a fact belongs to the plan it was found under")
    st = write(st, claim_author(a), "fact", f, a.text, plan)
    if a.check:
        recheck(st, [st.order[-1]], out=sys.stderr)


def cmd_is(st, a):
    t = st.resolve(a.id)
    write(st, claim_author(a), "fact", {"on": t, "is": a.value}, a.why, st.e[t]["plan"])


def cmd_plan(st, a):
    f = {}
    if a.need:
        f["need"] = ",".join(st.resolve(x) for x in a.need.split(","))
    if a.verify:
        f["verify"] = a.verify
    if a.from_:
        f["from"] = st.resolve(a.from_)
    write(st, claim_author(a), "plan", f, a.text)


def cmd_need(st, a, op):
    t = target(st, a.id, plan_only=True)
    ids = ",".join(st.resolve(x) for x in a.ids.split(","))
    write(st, claim_author(a), "fact", {"on": t, op: ids}, plan=t)


def cmd_rule(st, a):
    t = target(st, a.id, plan_only=True)
    write(st, claim_author(a), "fact", {"on": t, "rule": a.text}, a.why, t)


def cmd_close(st, a):
    if not is_human(claim_author(a)):
        raise DocketError("only human may close directly; logic closes via `verify`")
    t = target(st, a.id, plan_only=True)
    write(st, a.by, "fact", {"on": t, "is": a.reason}, a.why, t)


def cmd_verify(st, a):
    i = target(st, a.id, plan_only=True)
    cmd = st.e[i]["f"].get("verify")
    if not cmd:
        raise DocketError(f"{i}: plan has no verify")
    if st.plan_status(i) != "open":
        raise DocketError(f"{i}: plan is closed")
    ok, extra = run_logic(cmd)
    if not ok:
        raise DocketError(f"verify failed (exit {extra['exit']}); plan stays open")
    write(st, "logic", "fact", {"on": i, "is": "solved", **extra}, "verify passed", i)
    print(f"CLOSED BY LOGIC: {i} solved · verify: {cmd} · commit {extra['commit']} — tell the human")


def cmd_recheck(st, a):
    ids = [st.resolve(a.id)] if a.id else [i for i in st.order if st.kind(i) == "fact"]
    recheck(st, [i for i in ids if st.e[i]["f"].get("check") and not st.successor(i)])


def cmd_ls(st, a):
    print("plans:")
    for i in st.plans:
        if a.all or st.plan_status(i) == "open":
            print(f"  {st.line(i, row=True)}")
    suspect = [i for i in st.plans if st.plan_status(i) == "solved" and st.worst(st.plans[i]["need"]) == "!"]
    if suspect:
        print("suspect (solved, but needs something broken):")
        for i in suspect:
            print(f"  {st.line(i)}")
    print("facts:")
    for i in st.order:
        if st.kind(i) == "fact" and (a.all or st.holds(i)):
            print(f"  {st.line(i)}")


def cmd_ready(st, a):
    for i in st.plans:
        if st.ready(i):
            print(st.line(i, row=True))


def cmd_brief(st, a):
    if not a.id:
        for i in st.plans:
            if st.plan_status(i) == "open":
                print(st.line(i, row=True))
        return
    i = st.resolve(a.id)
    print(st.line(i, row=True))
    if i not in st.plans:
        return
    print(f"  verify: {st.e[i]['f'].get('verify') or '(none; only human may close)'}")
    rules = st.rules_for(i)
    if rules:
        print("  rules:")
        for y in rules:
            f = st.e[y]["f"]
            print(f"    {st.flag(y)} R {y} (of {f['on']}) [{st.label(y)}] {f['rule']}")
    seen = set()

    def walk(p, d):
        for n in sorted(st.plans[p]["need"], key=lambda n: "!…? ".index(st.flag(n))):
            print("  " + "  " * d + st.line(n))
            if n in st.plans and st.plan_status(n) == "open" and n not in seen:
                seen.add(n)
                walk(n, d + 1)
    walk(i, 0)


def cmd_show(st, a):
    i = st.resolve(a.id)
    print(st.line(i, row=True) if st.kind(i) != "on" else summary(st.e[i]))
    if st.kind(i) != "on" and "\n" in st.e[i]["body"]:
        print("    " + st.e[i]["body"].replace("\n", "\n    "))
    for y in sorted(st.about.get(i, []) + st.on_plan.get(i, [])):
        print("  " + summary(st.e[y]) + ("" if st.holds(y) else f"  [{st.label(y)}]"))
    users = [p for p in st.plans if i in st.plans[p]["need"]]
    if users:
        print("needed by:")
        for p in users:
            print(f"  {st.line(p)}")


def cmd_lint(st, a):
    for name in log_files():
        want = "\n".join(render_entry(e) for e in sorted(
            (x for x in st.e.values() if x["plan"] == name[:-3]), key=lambda x: x["id"]))
        if read_text(name) != want:
            raise DocketError(f"log/{name}: not in canonical form (hand-edited?)")
    r = subprocess.run(["git", "-C", HERE, "ls-tree", "-r", "--name-only", "HEAD", "--", "log"],
                       capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print("note: no git HEAD here; append-only check skipped")
    for path in r.stdout.split() if r.returncode == 0 else []:
        old = subprocess.run(["git", "-C", HERE, "show", f"HEAD:./{path}"], capture_output=True, text=True, encoding="utf-8").stdout
        if not os.path.exists(os.path.join(HERE, path)):
            raise DocketError(f"{path}: committed file was deleted")
        with open(os.path.join(HERE, path), encoding="utf-8") as fh:
            if not fh.read().startswith(old):
                raise DocketError(f"{path}: committed content was changed (only appending is allowed)")
    print(f"ok: {len(st.order)} entries, {len(st.plans)} plans")


def main():
    # log is UTF-8; console default (e.g. cp1252 on Windows) cannot print it
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(prog="docket.py", description="Append-only facts and plans. See README.md.")
    ap.add_argument("--by", default=os.environ.get("DOCKET_BY"), help="author: human[:name] or agent name (env DOCKET_BY)")
    sp = ap.add_subparsers(dest="cmd", required=True)

    p = sp.add_parser("plan", help="open a plan (creates its file)")
    p.add_argument("text")
    p.add_argument("--need", metavar="ID,ID")
    p.add_argument("--verify", metavar="CMD", help="shell command; exit 0 lets logic close it")
    p.add_argument("--from", dest="from_", metavar="ID", help="plan this one replaces")
    p.set_defaults(fn=cmd_plan)

    p = sp.add_parser("fact", help="add a fact to a plan's file")
    p.add_argument("text")
    p.add_argument("--in", dest="in_", metavar="PLAN", help="plan it was found under (default: that of --replaces)")
    p.add_argument("--src")
    p.add_argument("--check", metavar="CMD", help="shell command; exit 0 = true (logic)")
    p.add_argument("--replaces", metavar="ID")
    p.set_defaults(fn=cmd_fact)

    p = sp.add_parser("is", help="claim a fact is true|false|replaced (by nothing)")
    p.add_argument("id")
    p.add_argument("value", choices=FACT_IS)
    p.add_argument("--why")
    p.set_defaults(fn=cmd_is)

    p = sp.add_parser("need", help="add needs to a plan")
    p.add_argument("id")
    p.add_argument("ids", metavar="ID,ID")
    p.set_defaults(fn=lambda st, a: cmd_need(st, a, "needs+"))

    p = sp.add_parser("unneed", help="remove needs from a plan")
    p.add_argument("id")
    p.add_argument("ids", metavar="ID,ID")
    p.set_defaults(fn=lambda st, a: cmd_need(st, a, "needs-"))

    p = sp.add_parser("rule", help="add a rule to a plan; plans it needs inherit it")
    p.add_argument("id")
    p.add_argument("text")
    p.add_argument("--why")
    p.set_defaults(fn=cmd_rule)

    p = sp.add_parser("close", help="human closes a plan")
    p.add_argument("id")
    p.add_argument("reason", choices=CLOSE_IS)
    p.add_argument("--why")
    p.set_defaults(fn=cmd_close)

    p = sp.add_parser("verify", help="run a plan's verify; exit 0 closes it as solved (logic)")
    p.add_argument("id")
    p.set_defaults(fn=cmd_verify)

    p = sp.add_parser("recheck", help="rerun fact checks (all, or one)")
    p.add_argument("id", nargs="?")
    p.set_defaults(fn=cmd_recheck)

    p = sp.add_parser("ls", help="open plans + true facts")
    p.add_argument("--all", action="store_true")
    p.set_defaults(fn=cmd_ls)

    p = sp.add_parser("ready", help="open plans whose needs all hold")
    p.set_defaults(fn=cmd_ready)

    p = sp.add_parser("brief", help="minimal context for a plan (or all open plans)")
    p.add_argument("id", nargs="?")
    p.set_defaults(fn=cmd_brief)

    p = sp.add_parser("show", help="one entry, everything about it, who needs it")
    p.add_argument("id")
    p.set_defaults(fn=cmd_show)

    p = sp.add_parser("lint", help="validate log/, canonical form, and append-only vs git HEAD")
    p.set_defaults(fn=cmd_lint)

    a = ap.parse_args()
    try:
        a.fn(State(read_entries()), a)
    except DocketError as err:
        print(f"docket: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
