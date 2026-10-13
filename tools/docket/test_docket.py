"""docket 的 fixture 測試。

    python3 -m unittest discover -s tools/docket -v

每個檢查碼都有一個「恰好只有這個缺陷」的 fixture；寫入指令的權限與拒絕路徑各有案例；
最後用固定種子的隨機操作驗證「任何合法操作序列之後，check 都是乾淨的」。
"""

from __future__ import annotations

import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import docket  # noqa: E402

TID = "202610140516_demo"
OTHER = "202610140600_other"
SRC = "human: tester · 「ok」"


def addr(n: int, tid: str = TID) -> str:
    return f"{tid}#{n}"


def entry(n, kind, state=None, ts="2026-10-14 05:16:35+08:00", title="t", body="內容", **kw) -> docket.Entry:
    e = docket.Entry(n=n, kind=kind, ts=ts, title=title, state=state, body=body)
    e.refs = {k: v for k, v in kw.items() if k in docket.REF_FIELDS and v}
    e.source = kw.get("source")
    if kind == "T":
        e.history = [docket.Hist("2026-10-14 05:16", "todo", "建立")]
    return e


def thread(entries, tid=TID, prev=None, topic="主題") -> docket.Thread:
    return docket.Thread(id=tid, prev=prev, spec=docket.SPEC, topic=topic, entries=list(entries))


def files(*threads) -> dict[str, str]:
    return {f"{t.id}.md": docket.render(t) for t in threads}


def codes(texts: dict[str, str]) -> set[str]:
    return {c.code for c in docket.analyze(texts).conflicts}


class RenderParse(unittest.TestCase):
    def test_roundtrip_is_identity(self):
        t = thread(
            [
                entry(1, "Q"),
                entry(2, "D", "accepted", answers=[addr(1)], source=SRC),
                entry(3, "O"),
                entry(4, "T", "landed", basis=[addr(2), addr(3)], needs=[]),
            ]
        )
        text = docket.render(t)
        self.assertEqual(docket.render(docket.parse(text, TID)), text)
        self.assertEqual(codes({f"{TID}.md": text}), set())

    def test_multiline_body_with_blank_lines_roundtrips(self):
        t = thread([entry(1, "O", body="第一段\n\n第二段\n\n#### 小標\n- 清單")])
        text = docket.render(t)
        self.assertEqual(docket.render(docket.parse(text, TID)), text)


class CheckCodes(unittest.TestCase):
    """每個檢查碼一個只含該缺陷的 fixture。"""

    def only(self, texts, code):
        self.assertEqual(codes(texts), {code})

    def test_clean_baseline(self):
        self.assertEqual(codes(files(thread([entry(1, "Q"), entry(2, "O")]))), set())

    def test_bad_format_id_mismatch(self):
        text = docket.render(thread([entry(1, "O")]))
        self.only({f"{OTHER}.md": text}, "BAD_FORMAT")

    def test_bad_format_non_consecutive_numbers(self):
        self.only(files(thread([entry(1, "O"), entry(3, "O")])), "BAD_FORMAT")

    def test_bad_format_basis_points_to_q(self):
        t = thread([entry(1, "Q"), entry(2, "T", "todo", basis=[addr(1)])])
        self.only(files(t), "BAD_FORMAT")

    def test_bad_format_field_not_allowed_for_kind(self):
        text = docket.render(thread([entry(1, "O")])).replace("內容", "- **state:** x\n\n內容", 1)
        self.only({f"{TID}.md": text}, "BAD_FORMAT")

    def test_bad_format_handed_off_without_target(self):
        self.only(files(thread([entry(1, "T", "handed-off")])), "BAD_FORMAT")

    def test_bad_format_wrong_spec(self):
        t = thread([entry(1, "O")])
        t.spec = "docket v0"
        self.only(files(t), "BAD_FORMAT")

    def test_bad_state(self):
        self.only(files(thread([entry(1, "D", "done")])), "BAD_STATE")
        self.only(files(thread([entry(1, "Q", "open")])), "BAD_STATE")  # Q 不存 open
        self.only(files(thread([entry(1, "T", None)])), "BAD_STATE")

    def test_missing_source(self):
        self.only(files(thread([entry(1, "D", "accepted")])), "MISSING_SOURCE")
        self.only(files(thread([entry(1, "T", "rejected")])), "MISSING_SOURCE")
        self.only(files(thread([entry(1, "Q", "dropped")])), "MISSING_SOURCE")

    def test_malformed_source(self):
        self.only(files(thread([entry(1, "D", "accepted", source="human: x")])), "MISSING_SOURCE")

    def test_dangling_ref_entry(self):
        self.only(files(thread([entry(1, "T", "todo", basis=[addr(9)])])), "DANGLING_REF")

    def test_dangling_ref_thread_and_prev(self):
        self.only(files(thread([entry(1, "T", "todo", basis=[addr(1, OTHER)])])), "DANGLING_REF")
        self.only(files(thread([entry(1, "O")], prev=OTHER)), "DANGLING_REF")

    def test_cyclic_needs(self):
        t = thread([entry(1, "T", "todo", needs=[addr(2)]), entry(2, "T", "todo", needs=[addr(1)])])
        self.only(files(t), "CYCLIC_NEEDS")
        self.only(files(thread([entry(1, "T", "todo", needs=[addr(1)])])), "CYCLIC_NEEDS")

    def test_cycle_across_threads(self):
        a = thread([entry(1, "T", "todo", needs=[addr(1, OTHER)])])
        b = thread([entry(1, "T", "todo", needs=[addr(1)])], tid=OTHER)
        self.only(files(a, b), "CYCLIC_NEEDS")

    def test_duplicate_thread(self):
        text = docket.render(thread([entry(1, "O")]))
        got = codes({f"{TID}.md": text, f"{OTHER}.md": text})
        self.assertIn("DUPLICATE_THREAD", got)

    def test_basis_superseded(self):
        t = thread(
            [
                entry(1, "D", "accepted", source=SRC),
                entry(2, "D", "accepted", supersedes=[addr(1)], source=SRC),
                entry(3, "T", "todo", basis=[addr(1)]),
            ]
        )
        self.only(files(t), "BASIS_SUPERSEDED")

    def test_basis_superseded_ignored_for_finished_t(self):
        t = thread(
            [
                entry(1, "D", "accepted", source=SRC),
                entry(2, "D", "accepted", supersedes=[addr(1)], source=SRC),
                entry(3, "T", "accepted", basis=[addr(1)], source=SRC),
            ]
        )
        self.assertEqual(codes(files(t)), set())

    def test_not_canonical_variants(self):
        good = docket.render(thread([entry(1, "D", "proposed", answers=[], source=None), entry(2, "O")]))
        variants = {
            "extra blank line": good.replace("\n\n### 2", "\n\n\n### 2"),
            "no trailing newline": good.rstrip("\n"),
            "blank line after heading removed": good.replace("— t\n\n", "— t\n", 1),
            "trailing blank lines": good + "\n\n",
        }
        for name, text in variants.items():
            with self.subTest(name):
                self.assertIn("NOT_CANONICAL", codes({f"{TID}.md": text}))
        # CRLF 連解析都過不了，同樣是衝突
        self.assertTrue(codes({f"{TID}.md": good.replace("\n", "\r\n")}) & {"BAD_FORMAT", "NOT_CANONICAL"})

    def test_hand_edit_of_observation_is_caught(self):
        good = docket.render(thread([entry(1, "O", body="原本的事實")]))
        edited = good.replace("原本的事實", "改過的事實")  # 仍然合法，不會被 NOT_CANONICAL 抓到
        self.assertEqual(codes({f"{TID}.md": edited}), set())
        # …所以只能靠「不提供改寫指令」保證；改成別種格式則會被抓到
        self.assertIn("NOT_CANONICAL", codes({f"{TID}.md": edited.replace("改過的事實", "改過的事實\n")}))

    def test_warnings_do_not_fail(self):
        big = thread([entry(i, "O") for i in range(1, docket.OVERGROWN_ENTRIES + 2)], topic="\n".join(["行"] * 25))
        result = docket.analyze(files(big))
        self.assertEqual({c.code for c in result.conflicts}, {"OVERGROWN", "HEADER_TOO_LONG"})
        self.assertEqual(result.errors, [])


class Env:
    """暫存根目錄 + 自動前進的時鐘 + 呼叫 main 的小工具。"""

    def __init__(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "docket.toml").write_text('timezone = "+08:00"\n', encoding="utf-8")
        self.clock = datetime(2026, 10, 14, 5, 16, 35)

    def close(self):
        self.tmp.cleanup()

    def run(self, *argv, stdin="", step=1):
        self.clock += timedelta(seconds=step)
        out, err = io.StringIO(), io.StringIO()
        env = {"DOCKET_NOW": self.clock.isoformat(timespec="seconds")}
        with mock.patch.dict(os.environ, env), mock.patch("sys.stdin", io.StringIO(stdin)), \
                contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            try:
                rc = docket.main(["--root", str(self.root), *argv])
            except SystemExit as exc:
                rc = int(exc.code)
        return rc, out.getvalue(), err.getvalue()

    def ok(self, *argv, stdin=""):
        rc, out, err = self.run(*argv, stdin=stdin)
        assert rc == 0, (argv, rc, out, err)
        return out

    def text(self, tid):
        return (self.root / f"{tid}.md").read_text(encoding="utf-8")

    def new_thread(self, slug="demo"):
        self.ok("new", slug, "--topic", "測試")
        return next(p.stem for p in sorted(self.root.glob("*.md")) if p.stem.endswith(slug))


class WriteCommands(unittest.TestCase):
    def setUp(self):
        self.env = Env()
        self.addCleanup(self.env.close)
        self.t = self.env.new_thread()

    def assert_refused(self, *argv, stdin="", contains=""):
        before = {p.name: p.read_text(encoding="utf-8") for p in self.env.root.glob("*.md")}
        rc, _, err = self.env.run(*argv, stdin=stdin)
        self.assertEqual(rc, 2, err)
        self.assertIn(contains, err)
        after = {p.name: p.read_text(encoding="utf-8") for p in self.env.root.glob("*.md")}
        self.assertEqual(before, after, "被拒絕的指令不得改動任何檔案")

    def add(self, kind, title="x", *flags, body="內容"):
        out = self.env.ok("add", self.t, kind, "--title", title, *flags, stdin=body)
        return out.strip().rsplit(" ", 1)[1]

    def test_add_assigns_serial_and_initial_state(self):
        q, d, o, t = self.add("q"), self.add("d"), self.add("o"), self.add("t")
        self.assertEqual([a.rsplit("#", 1)[1] for a in (q, d, o, t)], ["1", "2", "3", "4"])
        th = docket.parse(self.env.text(self.t), self.t)
        self.assertEqual([e.state for e in th.entries], [None, "proposed", None, "todo"])
        self.assertEqual(th.entries[3].history[0].kind, "todo")
        self.assertEqual(self.env.ok("check").strip().startswith("[docket] 乾淨"), True)

    def test_d_and_o_have_no_rewrite_or_append(self):
        self.add("d"), self.add("o"), self.add("q"), self.add("t")
        self.assert_refused("rewrite", addr(1, self.t), stdin="新", contains="不可變")
        self.assert_refused("rewrite", addr(2, self.t), stdin="新", contains="不可變")
        self.assert_refused("append", addr(1, self.t), stdin="新", contains="只能用於 Q")
        self.assert_refused("append", addr(4, self.t), stdin="新", contains="只能用於 Q")

    def test_q_append_and_t_rewrite_work_and_keep_history(self):
        self.add("q"), self.add("t")
        self.env.ok("append", addr(1, self.t), stdin="補充一")
        self.env.ok("rewrite", addr(2, self.t), stdin="新的正文")
        th = docket.parse(self.env.text(self.t), self.t)
        self.assertIn("補充一", th.entries[0].body)
        self.assertEqual(th.entries[1].body, "新的正文")
        self.assertEqual([h.kind for h in th.entries[1].history], ["todo", "rewrite"])

    def test_terminal_transitions_need_source(self):
        self.add("q"), self.add("d"), self.add("t")
        for a, state in ((1, "dropped"), (2, "accepted"), (2, "rejected"), (3, "rejected")):
            self.assert_refused("set", addr(a, self.t), state, contains="--source")
        self.env.ok("set", addr(3, self.t), "landed")
        self.assert_refused("set", addr(3, self.t), "accepted", contains="--source")
        self.env.ok("set", addr(3, self.t), "accepted", "--source", SRC)

    def test_source_not_allowed_on_agent_transitions_and_must_be_wellformed(self):
        self.add("t"), self.add("d")
        self.assert_refused("set", addr(1, self.t), "landed", "--source", SRC, contains="不需要")
        self.assert_refused("set", addr(2, self.t), "accepted", "--source", "human", contains="格式")

    def test_invalid_transitions(self):
        self.add("d"), self.add("t")
        self.assert_refused("set", addr(2, self.t), "accepted", "--source", SRC, contains="不能從 todo")
        self.env.ok("set", addr(1, self.t), "accepted", "--source", SRC)
        self.assert_refused("set", addr(1, self.t), "rejected", "--source", SRC, contains="不能從 accepted")
        self.assert_refused("set", addr(1, self.t), "bogus", contains="state 必須是")

    def test_handoff_requires_target_and_records_it(self):
        self.add("t"), self.add("t")
        self.assert_refused("set", addr(1, self.t), "handed-off", contains="--to")
        self.assert_refused("set", addr(1, self.t), "landed", "--to", addr(2, self.t), contains="只用於 handed-off")
        self.env.ok("set", addr(1, self.t), "handed-off", "--to", addr(2, self.t), "--note", "換人")
        self.assertIn("承接自", self.env.ok("show", addr(2, self.t)))
        self.assert_refused("set", addr(1, self.t), "handed-off", "--to", addr(9, self.t), contains="不能從")

    def test_handoff_to_missing_or_wrong_kind_is_refused(self):
        self.add("t"), self.add("o")
        self.assert_refused("set", addr(1, self.t), "handed-off", "--to", addr(9, self.t), contains="DANGLING_REF")
        self.assert_refused("set", addr(1, self.t), "handed-off", "--to", addr(2, self.t), contains="BAD_FORMAT")

    def test_note_rules(self):
        self.add("t"), self.add("o")
        self.env.ok("note", addr(1, self.t), "decision", "一行文字")
        self.assert_refused("note", addr(1, self.t), "landed", "偽造狀態", contains="不能與 T 的狀態名")
        self.assert_refused("note", addr(2, self.t), "decision", "x", contains="只用於 T")
        self.assert_refused("note", addr(1, self.t), "decision", "兩\n行", contains="單行")

    def test_refuses_writes_that_create_new_conflicts(self):
        self.add("t")
        self.assert_refused("add", self.t, "t", "--title", "x", "--basis", addr(99, self.t), stdin="b", contains="DANGLING_REF")
        self.assert_refused("add", self.t, "t", "--title", "x", "--needs", addr(1, self.t), "--basis", addr(1, self.t),
                            stdin="b", contains="BAD_FORMAT")  # basis 指向 T
        self.assert_refused("add", self.t, "o", "--title", "x", "--basis", addr(1, self.t), stdin="b", contains="不能有 --basis")

    def test_body_and_title_validation(self):
        self.assert_refused("add", self.t, "o", "--title", "x", stdin="### 5 · Q · 偽造", contains="不能含有")
        self.assert_refused("add", self.t, "o", "--title", "x", stdin="**沿革**", contains="不能含有")
        self.assert_refused("add", self.t, "o", "--title", "x", stdin="  \n", contains="不能是空的")
        self.assert_refused("add", self.t, "o", "--title", "a\nb", stdin="b", contains="單行")
        self.env.ok("add", self.t, "o", "--title", "x", stdin="#### 允許的小標\n\n文字")

    def test_clock_going_backwards_is_refused(self):
        self.add("o")
        rc, _, err = self.env.run("add", self.t, "o", "--title", "x", stdin="b", step=-3600)
        self.assertEqual(rc, 2)
        self.assertIn("早於", err)

    def test_new_rejects_duplicates_and_bad_slugs(self):
        rc, _, _ = self.env.run("new", "Bad Slug", "--topic", "x")
        self.assertEqual(rc, 2)
        self.env.clock -= timedelta(seconds=1)  # 回到同一分鐘
        rc, _, err = self.env.run("new", "demo", "--topic", "x", step=0)
        self.assertEqual(rc, 2)
        self.assertIn("已存在", err)

    def test_new_with_missing_prev_is_refused(self):
        self.assert_refused("new", "child", "--topic", "x", "--prev", OTHER, contains="DANGLING_REF")

    def test_no_temp_files_left_behind(self):
        self.add("o"), self.add("q")
        self.assertEqual([p.name for p in self.env.root.iterdir() if p.name.startswith(".docket-")], [])

    def test_preexisting_errors_do_not_block_unrelated_writes(self):
        (self.env.root / f"{OTHER}.md").write_text("garbage\n", encoding="utf-8")
        self.add("o")  # 不應被別的檔案既有的錯誤擋住
        rc, out, _ = self.env.run("check")
        self.assertEqual(rc, 1)
        self.assertIn("BAD_FORMAT", out)


class Derived(unittest.TestCase):
    def setUp(self):
        self.env = Env()
        self.addCleanup(self.env.close)
        self.t = self.env.new_thread()

    def add(self, kind, *flags, title="x"):
        self.env.ok("add", self.t, kind, "--title", title, *flags, stdin="內容")

    def test_q_answered_by_accepted_d_only(self):
        self.add("q"), self.add("d", "--answers", addr(1, self.t))
        self.assertIn(addr(1, self.t), self.env.ok("queue"))
        self.env.ok("set", addr(2, self.t), "accepted", "--source", SRC)
        queue = self.env.ok("queue")
        self.assertNotIn(addr(1, self.t), queue)
        self.assertIn("answered", self.env.ok("show", addr(1, self.t)))

    def test_proposed_d_does_not_answer(self):
        self.add("q"), self.add("d", "--answers", addr(1, self.t))
        self.env.ok("set", addr(2, self.t), "rejected", "--source", SRC)
        self.assertIn(addr(1, self.t), self.env.ok("queue"))

    def test_supersede_flags_dependent_open_task(self):
        self.add("d"), self.add("t", "--basis", addr(1, self.t))
        self.env.ok("set", addr(1, self.t), "accepted", "--source", SRC)
        self.add("d", "--supersedes", addr(1, self.t))
        rc, _, err = self.env.run("set", addr(3, self.t), "accepted", "--source", SRC)
        self.assertEqual(rc, 2)
        self.assertIn("BASIS_SUPERSEDED", err)  # 會讓 T 的依據失效，寫入被拒

    def test_blocked_label_and_unblock(self):
        self.add("t"), self.add("t", "--needs", addr(1, self.t))
        self.assertIn("blocked", self.env.ok("show", addr(2, self.t)))
        self.env.ok("set", addr(1, self.t), "landed")
        self.assertIn("blocked", self.env.ok("show", addr(2, self.t)))  # landed 還不是終態
        self.env.ok("set", addr(1, self.t), "accepted", "--source", SRC)
        self.assertNotIn("blocked", self.env.ok("show", addr(2, self.t)))

    def test_thread_activity_and_head(self):
        self.add("o")
        self.env.ok("index")
        self.assertIn("（無）", (self.env.root / "head.md").read_text(encoding="utf-8"))
        self.add("q")
        self.env.ok("index")
        head = (self.env.root / "head.md").read_text(encoding="utf-8")
        self.assertIn(self.t, head)
        self.assertIn("未結束 1", head)

    def test_index_is_idempotent_and_refuses_when_conflicts(self):
        self.add("q")
        self.env.ok("index")
        first = (self.env.root / "head.md").read_text(encoding="utf-8")
        self.assertIn("已是最新", self.env.ok("index"))
        self.assertEqual((self.env.root / "head.md").read_text(encoding="utf-8"), first)
        (self.env.root / f"{OTHER}.md").write_text("garbage\n", encoding="utf-8")
        rc, _, err = self.env.run("index")
        self.assertEqual(rc, 2)

    def test_show_marks_superseded_basis_and_hides_history_by_default(self):
        self.add("d"), self.add("o")
        self.env.ok("set", addr(1, self.t), "accepted", "--source", SRC)
        self.add("t", "--basis", addr(1, self.t), addr(2, self.t))
        self.env.ok("set", addr(3, self.t), "landed", "--note", "完成")
        default = self.env.ok("show", addr(3, self.t))
        self.assertIn("未顯示", default)
        self.assertNotIn("完成", default)
        self.assertIn("完成", self.env.ok("show", addr(3, self.t), "--history"))
        self.assertIn("內容", default)  # 依據的正文有帶出來


class CheckCommand(unittest.TestCase):
    def setUp(self):
        self.env = Env()
        self.addCleanup(self.env.close)
        self.t = self.env.new_thread()
        self.env.ok("add", self.t, "o", "--title", "x", stdin="事實")

    def test_hand_edit_detected_as_not_canonical(self):
        path = self.env.root / f"{self.t}.md"
        path.write_text(path.read_text(encoding="utf-8").replace("事實", "事實\n\n\n"), encoding="utf-8")
        rc, out, _ = self.env.run("check")
        self.assertEqual(rc, 1)
        self.assertIn("NOT_CANONICAL", out)

    def test_hook_runs_only_for_docket_files(self):
        path = self.env.root / f"{self.t}.md"
        path.write_text(path.read_text(encoding="utf-8") + "\n\n\n", encoding="utf-8")

        def hook(file_path):
            return self.env.run("check", "--hook", stdin=json.dumps({"tool_input": {"file_path": file_path}}))

        rc, _, err = hook(str(path))
        self.assertEqual(rc, 2)
        self.assertIn("NOT_CANONICAL", err)
        self.assertEqual(hook(str(self.env.root / "other.txt"))[0], 0)
        self.assertEqual(self.env.run("check", "--hook", stdin="not json")[0], 0)

    def test_files_in_subdirectories_are_ignored(self):
        (self.env.root / "archive").mkdir()
        (self.env.root / "archive" / f"{OTHER}.md").write_text("garbage\n", encoding="utf-8")
        self.assertEqual(self.env.run("check")[0], 0)


class RandomWalk(unittest.TestCase):
    """固定種子的隨機操作：每一步之後 check 都必須乾淨，且每個檔案都等於自己的渲染。"""

    def test_random_valid_operations_keep_corpus_clean(self):
        env = Env()
        self.addCleanup(env.close)
        seed = 20261014

        def rnd(n):
            nonlocal seed
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            return seed % n

        threads = [env.new_thread("alpha"), env.new_thread("beta")]
        env.clock += timedelta(minutes=2)  # 第二個 thread 的 id 不能與第一個同一分鐘（已由 slug 區分）
        applied = refused = 0
        for _ in range(250):
            tid = threads[rnd(2)]
            th = docket.parse(env.text(tid), tid)
            n = len(th.entries)
            op = rnd(8)
            if op == 0 or n == 0:
                kind = "qdot"[rnd(4)]
                flags = []
                pool = [(x.addr(tid), x.kind) for t2 in threads for x in docket.parse(env.text(t2), t2).entries]
                if kind == "d" and rnd(2):
                    qs = [a for a, k in pool if k == "Q"]
                    if qs:
                        flags = ["--answers", qs[rnd(len(qs))]]
                if kind == "t" and rnd(2):
                    ds = [a for a, k in pool if k in "OD"]
                    if ds:
                        flags = ["--basis", ds[rnd(len(ds))]]
                rc, _, _ = env.run("add", tid, kind, "--title", "x", *flags, stdin="內容")
            elif op in (1, 2, 3):
                e = th.entries[rnd(n)]
                targets = {"Q": ["dropped"], "D": ["accepted", "rejected"], "T": ["landed", "accepted", "rejected", "todo"]}.get(e.kind, [])
                if not targets:
                    continue
                state = targets[rnd(len(targets))]
                flags = ["--source", SRC] if state in docket.SOURCE_STATES else []
                rc, _, _ = env.run("set", e.addr(tid), state, *flags)
            elif op == 4:
                e = th.entries[rnd(n)]
                rc, _, _ = env.run("rewrite", e.addr(tid), stdin="改寫")
            elif op == 5:
                e = th.entries[rnd(n)]
                rc, _, _ = env.run("append", e.addr(tid), stdin="補充")
            elif op == 6:
                e = th.entries[rnd(n)]
                rc, _, _ = env.run("note", e.addr(tid), "memo", "記一筆")
            else:
                rc, _, _ = env.run("index")
            self.assertIn(rc, (0, 2))
            applied += rc == 0
            refused += rc == 2
            result = docket.analyze(docket.scan(env.root))
            self.assertEqual(result.errors, [], "任何操作之後都不該留下衝突")
        self.assertGreater(applied, 100)
        self.assertGreater(refused, 5)


if __name__ == "__main__":
    unittest.main()
