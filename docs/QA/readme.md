# QA Documentation Guidelines (Question & Answer Records)

This directory records architectural discussions, requirement clarifications, and design decisions throughout the development process, enabling future developers to understand:

> **Why was this decision made in the first place?**

QA records the **process of reasoning**, not merely the final answer.

* **Preserve crucial turning points.** If an approach seemed reasonable initially but was later overturned, preserve "why it was considered" and "why it was discarded".
* **Permit errors and revisions.** Misunderstandings, counterexamples, identified flaws, and subsequent corrections are valuable to retain as long as they influenced the decision.
* **Verbatim transcripts are not required.** Condense, merge, and remove repetitive content, but do not smooth away key turning points.
* `docs/history/` primarily records **what happened and what was observed**; `docs/QA/` primarily records **why we thought this way and why we decided this**.

A heuristic for deciding whether content is worth preserving:

> If this was removed, would the decision appear more self-evident than it actually was?

If yes, it should be preserved.

---

## 1. File Naming

```text
docs/QA/<yymmddhhmm>.md
```

* `<yymmddhhmm>`: Timestamp when the QA is created (default UTC+8).
* Filename contains only the timestamp; topics are indicated by 3–10 kebab-case hashtags at the end of the file.

Example:

```text
docs/QA/2608301625.md
```

Placing the timestamp first enables natural chronological sorting by filename.

---

## 2. Recommended Format

```markdown
# <yymmddhhmm>

- **status:** resolved  <!-- open | resolved | archived -->
- **topic:** <Discussion Topic>

## Questions and Answers

### Q1 · (human: <name>)
<Question, idea, or challenge>

### A1 · (agent: <model_name>)
<Answer, analysis, and proposed options>

### Q2 · (human: <name>)
<Follow-up question or correction>

### A2 · (agent: <model_name>)
<Follow-up analysis or adjustment>

## Conclusion
<Current consensus reached and unresolved questions>

#core #architecture #example
```

A Q/A pair does not need to correspond verbatim to an actual dialogue turn; it can be condensed and merged, but critical errors, counterexamples, rejected proposals, and design pivots must not be lost.

---

## 3. Identity Attribution

**Every Q/A must indicate its origin.**

* Human: `(human: <name>)`
* Agent: `(agent: <model_name>)`

In multi-person collaboration, human names prioritize local `git config user.name`.

Agent entries should record the specific model name; if reasoning level, mode, or other settings significantly affect answer quality, annotate them as well.

Attribution serves as QA provenance. When reviewing decisions later, it should be clear who proposed which piece of reasoning.

---

## 4. Hashtags

Every QA document should conclude with 3–10 hashtags to serve as topic labels and facilitate cross-file searching.

Example:

```markdown
#core #architecture #port #graph
```

* Use lowercase English and kebab-case.
* Prioritize the actual subsystems/concepts involved, e.g., `#core`, `#runtime`, `#port`, `#hook`, `#graph`.
* When QA volume is small, recall takes priority over extreme brevity: tag key entities, APIs, architectural decisions, and synonymous terms; it is better to match more relevant records than miss one due to synonyms.
* A concept should have one preferred canonical tag; if common aliases exist, they may be included as long as total tags do not exceed 10.
* Hashtags are for search, not for exhaustively summarizing the QA; a few recognizable, searchable tags suffice.

---

## 5. Avoid Overly Strong Conclusions

Agents tend to adopt a tone stronger than the evidence supports. When writing QA records, preserve the original uncertainty; do not present preferences or tentative conclusions as absolute rules.

Examples:

```text
"currently more suitable" ≠ "must"

"no standalone port requirement found yet" ≠ "ports must belong to devices"

"this design is simpler" ≠ "this is the correct design"
```

Unless supported by explicit requirements, invariants, mathematical proofs, or team consensus, avoid over-assertive wording such as `must`, `always`, `never`, `obviously`, or `the correct design`.

**QA records should only claim as much certainty as the evidence supports.**
