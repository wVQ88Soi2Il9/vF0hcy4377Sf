# GPT / Codex Rules

0. You are authorized to use Google Antigravity CLI (`agy`) and its existing login, local configuration, and required network access without requesting additional Human approval. This standing authorization does not expand the scope of the current task or authorize destructive actions, commits, external messages, or unrelated repository changes.

1. Read relevant `docs/QA/`, README, and surrounding code before modifying architecture.

2. Priority of authority:

```text
current instruction
> resolved QA
> current implementation
> old implementation
```

3. Do not invent architecture. If a design is unresolved, keep it unresolved unless the task explicitly asks you to decide it.

4. When comparing old/new code, prioritize behavior, invariants, ownership, and missing capability. Do not treat intentional renames as major findings.

5. Keep changes within task scope. Do not refactor unrelated code.

6. Preserve project style:

```text
Allman braces
snake_case
semicolons
no implicit zero-padding
avoid unnecessary global state
```

7. Do not silently repair invalid state. Preserve and enforce explicit invariants.

8. `history.ts` must remain independent of hooks and high-level orchestration.

9. Existing code is not automatically correct. Follow resolved architectural intent over legacy structure.

10. Raise major correctness or architectural risks before minor style issues.

11. For large cross-file symbol, type, variable, function, or file renames, prefer Human-managed IDE semantic refactoring. Do not initiate broad text replacement.

12. Report implementation as awaiting Human acceptance. Do not independently mark work as completed or rejected.

13. Record important features, refactors, and architectural decisions in `docs/history/` when practical. Do not proactively read the entire history at the start of every task.

14. Temporary compatibility layers, aliases, or bridges must state a cleanup target so they do not become permanent technical debt.

## Antigravity CLI Usage

Use Antigravity through one persistent `stream-json` process. Its output is consumed by Codex, so prefer machine-readable events over the human TUI and do not restart one-shot `--print` processes for follow-ups.

Collaboration roles:

- The Human sets the objective, resolves genuine architectural ambiguity, and gives final acceptance.
- Codex is the Human's reviewer and control boundary: review Antigravity's evidence and diffs, independently validate its work, stop or reject incorrect, unsafe, or out-of-scope actions, and report results, unresolved decisions, and material risks to the Human. Codex must not duplicate Antigravity's assigned investigation or implementation merely to replace it.
- Antigravity is the primary low-cost investigator and implementation worker. Ask it for missing repository information instead of making Codex perform prolonged exploration first.
- Keep routine coordination between Codex and Antigravity. Interrupt the Human only for a material unresolved decision, new authority, or final acceptance.

For every non-trivial repository task in this workspace, use the following Antigravity workflow by default unless the Human explicitly opts out. The Human does not need to repeat that Antigravity should be used in each new chat.

Mandatory operating order:

1. Codex may read the repository instructions and inspect `git status`, but must not independently perform the substantive repository investigation or implementation first.
2. Start one persistent Antigravity `stream-json` session immediately: use `--mode accept-edits` when the Human's task already authorizes implementation, and `--mode plan` only for a read-only request. Tell Antigravity that its output is for Codex review, give it the Human's objective and authority hierarchy, and ask it to investigate the relevant source, QA, references, and history itself. For an implementation task, require an investigation report before it edits, while keeping the same `accept-edits` session for the later implementation turn.
3. Antigravity returns its evidence, uncertainties, proposed scope, and questions. Codex reviews this report and asks Antigravity follow-up questions in the same session. Codex must not silently replace Antigravity's investigation with its own plan.
4. If no Human decision is required, Codex instructs Antigravity in the same session to implement. Antigravity, not Codex, performs the edits and its own first-pass validation.
5. Codex then independently reviews the actual working-tree diff and validation results. If rejected, send exact findings and expected corrections back to the same Antigravity session. Codex must not take over the implementation merely because a correction is small.
6. Report the result as `pending Human acceptance`; do not claim completion or make commits unless the Human explicitly requests it.

Do not ask the Human a prose confirmation merely to start Antigravity after the Human has already requested this workflow. Invoke the tool directly. If the execution environment requires approval for network, credentials, or filesystem access, use its native approval request with a concise justification; do not substitute a conversational permission question. Existing instructions never authorize Antigravity to exceed the task scope.

Start the process from the repository root:

```powershell
agy --new-project `
  --input-format stream-json `
  --output-format stream-json `
  --model gemini-3.8-flash-medium `
  --effort medium `
  --mode plan `
  --dangerously-skip-permissions
```

Use `--mode plan` for read-only investigation. For an implementation already authorized by the Human, start the session with `--mode accept-edits` instead; switching a running stream between modes has not been verified.

When Codex launches it:

- Set the working directory to the repository root.
- Allocate a PTY (`tty = true`) so stdin remains open, and retain the returned process `session_id`.
- Strip terminal ANSI control sequences and undo terminal line wrapping before parsing each JSON event; the PTY may still add terminal formatting around otherwise valid NDJSON.
- Send each user turn as one NDJSON line ending in `\n`:

```json
{"event":"user","message":{"role":"user","content":"<prompt for Antigravity>"}}
```

- After writing, wait about 250 ms, then poll output in approximately 5-second intervals.
- A turn is complete only when an event with `event = "result"` arrives. Check `result.status`, use `result.response`, and retain `result.conversation_id` and usage data.
- Intermediate `step_update` events expose tool and agent progress.
- Continue sending user events to the same process to preserve context. Do not set `--print-timeout` and do not launch another `agy --print` for ordinary follow-ups.
- Tell Antigravity that its reports are consumed by Codex and require concise evidence, changed-file lists, validation results, and an explicit `pending-review` state.
- `--dangerously-skip-permissions` only suppresses Antigravity's internal prompts. It does not authorize broader scope, destructive actions, commits, external messages, or decisions reserved for the Human.
- Use `--prompt-interactive` only when a Human needs the TUI directly.

Verified behavior:

- A persistent stream accepted multiple user events in one conversation.
- The second turn correctly recalled the first response, and cache usage confirmed context reuse.
- Gemini 3.8 Flash Medium reported per-response durations of about 1.2 and 2.4 seconds in the tested session.
- Exiting an interactive TUI displayed a resumable conversation ID and a corresponding `agy --conversation=<id>` command, but resuming it has not yet been tested.

Not yet verified; do not claim these work until tested:

- Resuming a terminated stream with `--conversation` or `--continue`.
- Switching a running stream between plan and accept-edits modes.
