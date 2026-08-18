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
- **Rely-Pack 擴充目錄 ($<rely_pack>/)** — 當 Pack A 需要向被依賴的 Pack B 提供擴充與整合邏輯時，在 Pack A 建立 `$<pack_b>/` 目錄放置對應模組，由 Pack A 的 `index.ts` 使用 `import.meta.glob('./$<pack_b>/*.ts', { eager: true })` 自行掃描並主動註冊至 Pack B，確保嚴格單向依賴。
- **CMD Position 偶數座標規範** — CMD 指令傳入的 `position`（如 `create` / `move`）強制驗證各維度座標均為偶數 integer。
- **地圖 UID 從 1 起算** — `game_map.unique_id` 從 1 開始分配，renderer 畫出 `#<uid>`，支援 `info --"<uid>"` 查詢。
- **Plan History 自動化處理** — Agent 處理任務時必須自動遵循 `docs/history` 工作流：
  1. **任務讀取**：接手特定任務（如 `<seq>#<n>`）時，自動執行 `python docs/history/plan-item.py <seq>#<n>` 讀取單一項目內文與依據，避免加載整份 Plan 檔。
  2. **狀態更新**：完成任務或變更狀態時，主動修改 Plan 檔對應項目的 `- **state:**`（如 `完成`），並記錄歷史沿革（`- H<n> · YYYY-MM-DD HH:MM <kind> —— ...`）。檔名統一精確至分鐘：`<seq>_<YYYYMMDDHHMM>_<topic>.md`。
  3. **自動同步**：任何 Plan 檔修訂後，強制執行 `python docs/history/update-head.py` 確保 0 衝突並自動更新 `head.md`。


## Unknown / TBD Policy

If something is marked `⚠️ unknown` in the docs, **do not implement it based on assumptions**. Flag it explicitly in code with a `// TODO: unknown — [reason]` comment and notify the user.