---
description: Project conventions and coding style rules
trigger: always_on
---

# Project Guidelines

Before starting **any task or writing any code** in this repository, you MUST read and strictly follow both documents below. These rules apply **now and for all future tasks**.

## Required Reading

1. [`docs/conventions.md`](docs/conventions.md) — Code style (Allman braces, snake_case), tech stack, pack structure & rules
2. [`docs/architecture.md`](docs/architecture.md) — Three-layer architecture, dependency rules, API boundary, Grid & Port coordinate system

## Key Principles (Quick Reference)

- **Allman braces** everywhere — `{` always on its own line
- **snake_case** for all identifiers, filenames, and JSON keys — no exceptions
- **結尾分號 `;`** — 所有陳述句結尾強制使用分號 `;`
- **Packs never import `@/core` directly** — only `@/API` is allowed
- **`unknown` items must not be hard-coded** — if a section in the docs is marked `unknown`, do not make assumptions; ask first or leave it explicitly unresolved
- **Single Source of Truth** — types live in `core/types.ts`, nothing is duplicated
- **拒絕隱性/靜態補齊 (No Implicit Zero-Padding)** — 假設所有資料都是乾淨完整的，向量運算與 JSON 藍圖向量長度必須嚴格匹配，嚴禁在程式碼中透過 `?? 0` 靜態補齊缺少的維度。
- **Pack 物件導出 (Object Export)** — 所有 Pack 對外暴露的 API/介面必須統一透過物件導出 (例如 `export const basic_renderer = { ... }`)，外部呼叫時一律使用物件點號存取。
- **每個 Device 強制具備專屬 Draw Function** — 每個 `device_definition` 必須擁有獨立的 `draw` 繪圖函式，嚴禁在 renderer 內部進行 inline/fallback 補齊假設。

## Unknown / TBD Policy

If something is marked `⚠️ unknown` in the docs, **do not implement it based on assumptions**. Flag it explicitly in code with a `// TODO: unknown — [reason]` comment and notify the user.