# 0062_202610140230_space-uid-map-and-uniqueness

- **status:** in-progress
- **prev:** ./0061_202610140117_pack-manifest-and-commit-event.md
- **skill:** plan-history v3

## 主題簡述

將 uid 的「唯一性（目標）」與「產生方式（方法）」分離，並讓 space 成為不含順序與計數器的集合，使 space 只取決於歷史樹與游標節點。

---

## 觀察與推論

### O1 · 2026-10-14 02:30:00+08:00 — 舊實作的 space 含有與路徑無關的狀態
`next_device_uid` 在 create 被 undo 時不會還原，`devices` 為陣列且 `push` 還原會改變順序。因此 `S(c)` 並非只由 `(T, c)` 決定（僅裝置的值層次上成立）。

### O2 · 2026-10-14 02:30:00+08:00 — 目標與方法分離
human 指出：唯一性是目標，`next_uid` 只是方法之一。space 以 `Map<uid, device>` 在結構上保證唯一，操作以前置條件 Fail-Fast 保證不重複；uid 如何產生不屬於 space 或操作。

### O3 · 2026-10-14 02:30:00+08:00 — 完成並通過驗證
`tsc` 無錯誤；`vitest run` 3 個檔案 18 個測試通過。隨機走訪歷史樹的性質測試經突變檢查（破壞 move 的 inverse）會失敗。

---

## 待辦

### 1 space 改為 Map 並移除 next_device_uid
- **state:** 等待確認
- **basis:** → O1, O2

`core.space.devices` 由 `device[]` 改為 `Map<uid, device>`；移除 `next_device_uid`。`camera/projection.ts`、`vanilla_beta/spatial.ts` 改走訪 `devices.values()`。

**沿革**

- H1 · 2026-10-14 02:30 決斷 —— 採用集合語意，space 與走訪順序無關（human: wVQ88Soi2Il9）
- H2 · 2026-10-14 02:30 落地 —— 完成（agent: claude） → O3

### 2 create 帶固定 uid，uid 產生方法分離
- **state:** 等待確認
- **basis:** → O2

`create_device_operation(device_uid, ...)`：uid 於建立操作時固定；execute 遇到已存在 uid、inverse 遇到不存在 uid、`delete_device` 的 inverse 遇到 uid 被佔用時皆 Fail-Fast，不再靜默略過。`std_world.allocate_uid()` 為可覆寫的 protected 方法，預設遞增整數；`uid` 型別仍為 `number`，是否放寬尚未決定。

**沿革**

- H1 · 2026-10-14 02:30 決斷 —— 目標（唯一性）與方法（next_uid）分離（human: wVQ88Soi2Il9）
- H2 · 2026-10-14 02:30 落地 —— 完成（agent: claude） → O3

### 3 新增 space 不變式測試
- **state:** 等待確認
- **basis:** → O1, O3

新增 `tests/space_invariant.test.ts`：uid 唯一性的 Fail-Fast、`allocate_uid` 可覆寫，以及固定種子的隨機走訪歷史樹（create / move / select_recipe / delete / jump_to），驗證同一節點的值快照恆相同。同步更新 `pack_manifest.test.ts` 與 `reversible_operation.test.ts`。

**沿革**

- H1 · 2026-10-14 02:30 決斷 —— 以性質測試檢驗 `S(c)` 只取決於 `(T, c)`（agent: claude）
- H2 · 2026-10-14 02:30 落地 —— 完成，突變檢查通過（agent: claude） → O3
