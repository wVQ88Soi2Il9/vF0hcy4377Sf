#!/usr/bin/env python3
"""Black-box tests for docket.py. Run: python3 -m unittest discover -s docs/docket"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

TOOL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docket.py")


class Repo:
    """A throwaway git repo with a copy of docket.py at docs/docket/."""

    def __init__(self):
        self.root = tempfile.mkdtemp()
        self.dir = os.path.join(self.root, "docs", "docket")
        self.logdir = os.path.join(self.dir, "log")
        os.makedirs(self.dir)
        shutil.copy(TOOL, self.dir)
        self.git("init", "-q")
        self.put("a.ts", "x\n")
        self.commit()

    def git(self, *args):
        subprocess.run(["git", "-C", self.root, *args], check=True, capture_output=True)

    def commit(self):
        self.git("add", "-A")
        self.git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "t", "--allow-empty")

    def put(self, name, text):
        with open(os.path.join(self.root, name), "w") as fh:
            fh.write(text)

    def run(self, *args, by="agent", ok=True):
        cmd = [sys.executable, os.path.join(self.dir, "docket.py")]
        if by:
            cmd += ["--by", by]
        r = subprocess.run(cmd + list(args), capture_output=True, text=True, cwd=self.root)
        if ok and r.returncode != 0:
            raise AssertionError(f"{args} failed: {r.stderr}")
        if not ok and r.returncode == 0:
            raise AssertionError(f"{args} should fail: {r.stdout}")
        if not ok and not r.stderr.startswith("docket: ") and "usage:" not in r.stderr:
            raise AssertionError(f"{args} should fail cleanly, got: {r.stderr}")
        return r

    def new(self, *args, by="agent"):
        return self.run(*args, by=by).stdout.split()[0]

    def label(self, i):
        line = self.run("show", i).stdout.splitlines()[0]
        return line[line.index("[") + 1:line.index("]")]

    def flag(self, i):
        return self.run("show", i).stdout[0]

    def path(self, plan):
        return os.path.join(self.logdir, plan + ".md")

    def files(self):
        return sorted(os.listdir(self.logdir)) if os.path.isdir(self.logdir) else []

    def read(self, plan):
        with open(self.path(plan)) as fh:
            return fh.read()

    def read_all(self):
        return "".join(self.read(f[:-3]) for f in self.files())

    def append(self, plan, text):
        with open(self.path(plan), "a") as fh:
            fh.write(text)

    def close(self):
        shutil.rmtree(self.root)


class Base(unittest.TestCase):
    def setUp(self):
        self.r = Repo()
        self.p0 = self.r.new("plan", "scratch")

    def tearDown(self):
        self.r.close()

    def fact(self, text, *args, by="agent", plan=None):
        return self.r.new("fact", text, "--in", plan or self.p0, *args, by=by)


class TestFiles(Base):
    def test_one_file_per_plan(self):
        p1 = self.r.new("plan", "second")
        self.assertEqual(self.r.files(), sorted([self.p0 + ".md", p1 + ".md"]))

    def test_fact_goes_into_its_plan_file(self):
        p1 = self.r.new("plan", "second")
        f = self.fact("found here", plan=p1)
        self.assertIn(f, self.r.read(p1))
        self.assertNotIn(f, self.r.read(self.p0))

    def test_fact_about_entry_goes_into_that_entrys_file(self):
        p1 = self.r.new("plan", "second")
        f = self.fact("found here", plan=p1)
        c = self.r.new("is", f, "false", by="human")
        self.assertIn(c, self.r.read(p1))

    def test_fact_requires_a_plan(self):
        self.r.run("fact", "orphan", ok=False)
        self.r.run("fact", "orphan", "--in", "99999999999999", ok=False)

    def test_replaces_defaults_to_the_old_facts_plan(self):
        p1 = self.r.new("plan", "second")
        old = self.fact("16ms", plan=p1)
        new = self.r.new("fact", "20ms", "--replaces", old)
        self.assertIn(new, self.r.read(p1))

    def test_multiline_body_roundtrips(self):
        f = self.fact("line one\n\nline two | with pipe")
        self.assertIn("line two | with pipe", self.r.run("show", f).stdout)
        self.r.run("lint", by=None)

    def test_body_may_not_contain_entry_heading(self):
        self.r.run("fact", "a\n## b", "--in", self.p0, ok=False)

    def test_field_must_be_one_line(self):
        self.r.run("fact", "x", "--in", self.p0, "--src", "a\nb", ok=False)

    def test_closed_plan_takes_no_new_facts_but_still_claims(self):
        f = self.fact("x")
        self.r.run("close", self.p0, "solved", "--why", "w", by="human")
        self.r.run("fact", "late", "--in", self.p0, ok=False)
        self.r.run("is", f, "false")
        self.assertTrue(self.r.label(f).startswith("false"))


class TestFacts(Base):
    def test_claim_starts_true_unverified(self):
        f = self.fact("users want undo", by="human")
        self.assertEqual(self.r.label(f), "true · unverified:human")
        self.assertEqual(self.r.flag(f), "?")

    def test_agent_can_refute_human(self):
        f = self.fact("users want undo", by="human")
        self.r.run("is", f, "false")
        self.assertEqual(self.r.label(f), "false · unverified:agent")

    def test_refuting_the_refutation_restores(self):
        f = self.fact("x", by="human")
        c = self.r.new("is", f, "false")
        self.r.run("is", c, "false", by="human")
        self.assertEqual(self.r.label(f), "true · unverified:human")

    def test_latest_claim_wins(self):
        f = self.fact("x")
        self.r.run("is", f, "false")
        self.r.run("is", f, "true", by="human")
        self.assertTrue(self.r.label(f).startswith("true"))

    def test_replaces_points_to_successor(self):
        old = self.fact("16ms")
        new = self.fact("20ms", "--replaces", old)
        self.assertEqual(self.r.label(old), f"replaced by {new}")

    def test_replaced_by_nothing(self):
        f = self.fact("16ms")
        self.r.run("is", f, "replaced")
        self.assertEqual(self.r.label(f), "replaced · unverified:agent")

    def test_stale_word_is_gone(self):
        f = self.fact("x")
        self.r.run("is", f, "stale", ok=False)

    def test_suffix_ref(self):
        f = self.fact("x")
        self.r.run("is", f[-5:], "false")
        self.assertTrue(self.r.label(f).startswith("false"))


class TestLogic(Base):
    CHECK = "! grep -q hooks a.ts"

    def test_check_pass_is_logic_true(self):
        f = self.fact("no hooks", "--check", self.CHECK)
        self.assertEqual(self.r.label(f), "true · logic")
        self.assertEqual(self.r.flag(f), " ")

    def test_check_never_passed_is_false(self):
        self.r.put("a.ts", "hooks\n")
        f = self.fact("no hooks", "--check", self.CHECK)
        self.assertEqual(self.r.label(f), "false · logic")

    def test_passed_then_failed_is_replaced_then_recovers(self):
        f = self.fact("no hooks", "--check", self.CHECK)
        self.r.put("a.ts", "hooks\n")
        self.r.run("recheck", by=None)
        self.assertEqual(self.r.label(f), "replaced · logic")
        self.r.put("a.ts", "x\n")
        self.r.run("recheck", by=None)
        self.assertEqual(self.r.label(f), "true · logic")

    def test_recheck_unchanged_writes_nothing(self):
        self.fact("no hooks", "--check", self.CHECK)
        before = self.r.read_all()
        self.r.run("recheck", by=None)
        self.assertEqual(before, self.r.read_all())

    def test_logic_beats_later_claim(self):
        f = self.fact("no hooks", "--check", self.CHECK)
        self.r.run("is", f, "false", by="human")
        self.assertEqual(self.r.label(f), "true · logic")

    def test_logic_records_commit(self):
        self.fact("no hooks", "--check", self.CHECK)
        self.assertIn("commit: ", self.r.read_all())
        self.assertNotIn("dirty: 1", self.r.read_all())

    def test_dirty_flag(self):
        self.r.put("b.ts", "new\n")
        self.fact("no hooks", "--check", self.CHECK)
        self.assertIn("dirty: 1", self.r.read_all())

    def test_nobody_can_write_logic(self):
        self.r.run("fact", "x", "--in", self.p0, by="logic", ok=False)


class TestPlans(Base):
    def test_needs_and_ready(self):
        f = self.fact("x")
        p1 = self.r.new("plan", "find budget")
        p2 = self.r.new("plan", "build", "--need", f"{f},{p1}")
        ready = self.r.run("ready", by=None).stdout
        self.assertIn(p1, ready)
        self.assertNotIn(p2, ready)
        self.r.run("close", p1, "solved", "--why", "16ms", by="human")
        self.assertIn(p2, self.r.run("ready", by=None).stdout)

    def test_broken_need_blocks_ready(self):
        f = self.fact("x")
        p = self.r.new("plan", "build", "--need", f)
        self.r.run("is", f, "false")
        self.assertNotIn(p, self.r.run("ready", by=None).stdout)
        self.assertEqual(self.r.flag(p), "!")

    def test_need_and_unneed(self):
        f = self.fact("x")
        p = self.r.new("plan", "build")
        self.r.run("need", p, f)
        self.assertIn(f, self.r.run("brief", p, by=None).stdout)
        self.r.run("unneed", p, f)
        self.assertNotIn(f, self.r.run("brief", p, by=None).stdout)

    def test_need_goes_into_the_plans_file(self):
        f = self.fact("x")
        p = self.r.new("plan", "build")
        n = self.r.new("need", p, f)
        self.assertIn(n, self.r.read(p))

    def test_refuted_need_is_ignored(self):
        f = self.fact("x")
        p = self.r.new("plan", "build")
        n = self.r.new("need", p, f)
        self.r.run("is", n, "false")
        self.assertNotIn(f, self.r.run("brief", p, by=None).stdout)

    def test_cycle_and_self_need_rejected(self):
        a = self.r.new("plan", "a")
        b = self.r.new("plan", "b", "--need", a)
        self.r.run("need", a, b, ok=False)
        self.r.run("need", a, a, ok=False)

    def test_agent_cannot_close(self):
        p = self.r.new("plan", "x")
        self.r.run("close", p, "solved", "--why", "w", ok=False)

    def test_human_close_is_decision(self):
        p = self.r.new("plan", "uid structure?")
        self.r.run("close", p, "solved", "--why", "use Map", by="human")
        self.assertIn("use Map", self.r.run("show", p, by=None).stdout)

    def test_verify_closes_as_logic(self):
        p = self.r.new("plan", "x", "--verify", "true")
        self.r.run("verify", p, by=None)
        self.assertEqual(self.r.label(p), "solved · logic")

    def test_failed_verify_keeps_open(self):
        p = self.r.new("plan", "x", "--verify", "false")
        self.r.run("verify", p, by=None, ok=False)
        self.assertEqual(self.r.label(p), "open")

    def test_close_is_final(self):
        p = self.r.new("plan", "x")
        close = self.r.new("close", p, "solved", "--why", "w", by="human")
        self.r.run("is", close, "false", by="human", ok=False)
        self.r.run("close", p, "invalid", "--why", "w", by="human", ok=False)
        self.r.run("need", p, p, ok=False)
        self.r.run("rule", p, "late", ok=False)

    def test_from_links_new_plan(self):
        p = self.r.new("plan", "x")
        self.r.run("close", p, "unable", "--why", "w", by="human")
        q = self.r.new("plan", "x again", "--from", p)
        self.assertIn(f"from: {p}", self.r.read(q))
        self.assertEqual(self.r.label(q), "open")

    def test_suspect_solved_plan(self):
        f = self.fact("x")
        p = self.r.new("plan", "build", "--need", f)
        self.r.run("close", p, "solved", "--why", "w", by="human")
        self.r.run("is", f, "false")
        self.assertIn("suspect", self.r.run("ls", by=None).stdout)


class TestRules(Base):
    def brief(self, p):
        return self.r.run("brief", p, by=None).stdout

    def test_rule_shows_in_own_brief(self):
        p = self.r.new("plan", "x")
        self.r.run("rule", p, "no new deps")
        self.assertIn("no new deps", self.brief(p))

    def test_rule_flows_to_needed_subplan_only(self):
        sub = self.r.new("plan", "sub")
        goal = self.r.new("plan", "goal", "--need", sub)
        other = self.r.new("plan", "other")
        self.r.run("rule", goal, "keep Allman braces")
        self.assertIn("keep Allman braces", self.brief(sub))
        self.assertNotIn("keep Allman braces", self.brief(other))

    def test_rule_flows_transitively(self):
        leaf = self.r.new("plan", "leaf")
        mid = self.r.new("plan", "mid", "--need", leaf)
        top = self.r.new("plan", "top", "--need", mid)
        self.r.run("rule", top, "no globals")
        self.assertIn("no globals", self.brief(leaf))

    def test_refuted_rule_disappears(self):
        p = self.r.new("plan", "x")
        rule = self.r.new("rule", p, "no new deps")
        self.r.run("is", rule, "false")
        self.assertNotIn("no new deps", self.brief(p))

    def test_closed_ancestor_rule_not_inherited(self):
        sub = self.r.new("plan", "sub")
        goal = self.r.new("plan", "goal", "--need", sub)
        self.r.run("rule", goal, "old rule")
        self.r.run("close", goal, "invalid", "--why", "dropped", by="human")
        self.assertNotIn("old rule", self.brief(sub))

    def test_rule_is_listed_unverified(self):
        p = self.r.new("plan", "x")
        self.r.run("rule", p, "no new deps", by="human")
        self.assertIn("unverified:human", self.brief(p))

    def test_rule_only_on_a_plan(self):
        f = self.fact("x")
        self.r.run("rule", f, "nope", ok=False)


class TestLint(Base):
    def test_requires_author(self):
        self.r.run("fact", "x", "--in", self.p0, by=None, ok=False)

    def test_ids_strictly_increase(self):
        ids = [self.fact(str(n)) for n in range(3)]
        self.assertEqual(ids, sorted(set(ids)))

    def test_lint_ok_after_normal_use(self):
        f = self.fact("x")
        self.r.run("is", f, "false")
        self.r.run("rule", self.p0, "r")
        self.r.run("lint", by=None)

    def test_lint_catches_edit_of_committed_text(self):
        self.fact("16ms")
        self.r.commit()
        self.r.run("lint", by=None)
        self.r.put(os.path.relpath(self.r.path(self.p0), self.r.root),
                   self.r.read(self.p0).replace("16ms", "20ms"))
        self.r.run("lint", by=None, ok=False)

    def test_lint_allows_appending_to_committed_file(self):
        self.fact("16ms")
        self.r.commit()
        self.fact("20ms")
        self.r.run("lint", by=None)

    def test_lint_catches_deleted_committed_file(self):
        self.r.commit()
        os.remove(self.r.path(self.p0))
        self.r.run("lint", by=None, ok=False)

    def test_lint_catches_non_canonical_file(self):
        self.r.append(self.p0, "\n")
        self.r.run("lint", by=None, ok=False)

    def test_lint_rejects_agent_close(self):
        self.r.append(self.p0, f"\n## 29990101000000 fact agent\non: {self.p0}\nis: solved\n\nw\n")
        self.r.run("lint", by=None, ok=False)

    def test_lint_rejects_logic_plain_fact(self):
        self.r.append(self.p0, "\n## 29990101000000 fact logic\n\nx\n")
        self.r.run("lint", by=None, ok=False)

    def test_lint_rejects_hand_written_logic_without_commit(self):
        f = self.fact("x", "--check", "true")
        self.r.append(self.p0, f"\n## 29990101000000 fact logic\non: {f}\nis: false\n")
        self.r.run("lint", by=None, ok=False)

    def test_lint_rejects_logic_on_target_without_check(self):
        f = self.fact("x")
        self.r.append(self.p0, f"\n## 29990101000000 fact logic\non: {f}\nis: true\ncommit: abc\n")
        self.r.run("lint", by=None, ok=False)

    def test_lint_rejects_logic_rule(self):
        self.r.append(self.p0, f"\n## 29990101000000 fact logic\non: {self.p0}\nrule: x\ncommit: abc\n")
        self.r.run("lint", by=None, ok=False)

    def test_lint_catches_dangling_ref(self):
        self.r.append(self.p0, "\n## 29990101000000 fact agent\non: 11111111111111\nis: false\n")
        self.r.run("lint", by=None, ok=False)

    def test_lint_rejects_entry_in_wrong_file(self):
        p1 = self.r.new("plan", "second")
        f = self.fact("x")
        self.r.append(p1, f"\n## 29990101000000 fact agent\non: {f}\nis: false\n")
        self.r.run("lint", by=None, ok=False)

    def test_lint_rejects_second_plan_in_a_file(self):
        self.r.append(self.p0, "\n## 29990101000000 plan agent\n\nsneaky\n")
        self.r.run("lint", by=None, ok=False)

    def test_lint_rejects_misnamed_file(self):
        os.rename(self.r.path(self.p0), self.r.path("20990101000000"))
        self.r.run("lint", by=None, ok=False)

    def test_lint_rejects_ids_out_of_order(self):
        self.r.append(self.p0, "\n## 20000101000000 fact agent\n\nold\n")
        self.r.run("ls", by=None, ok=False)
        self.r.run("lint", by=None, ok=False)


if __name__ == "__main__":
    unittest.main()
