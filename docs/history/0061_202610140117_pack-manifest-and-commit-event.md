# 0061_202610140117_pack-manifest-and-commit-event

- **status:** in-progress
- **prev:** ./0060_202609060315_vanilla-alpha-merge-init-to-index.md
- **skill:** plan-history v3

## 主題簡述

依 QA `2610140017`，以 pack manifest + compose + 單一 `core:committed` 事件，取代 `global_init` / `world_init` / 每世界 hook 注入。

---

## 觀察與推論

### O1 · 2026-10-14 01:17:00+08:00 — 舊注入方式的 `world_init` 從未執行
`vanilla_alpha.global_init` 註冊進 registry 的物件不含 `world_init`，而 `pure_world` 從 registry 呼叫 `world_init`，轉發鏈從未生效。詳見 QA `2610140017` A1。

### O2 · 2026-10-14 01:17:00+08:00 — 完成替換並通過型別檢查與測試
`tsc -p tsconfig.app.json` 無錯誤；`vitest run` 2 個檔案 10 個測試全數通過；`vite build` 成功。

---

## 待辦

### 1 Core 契約：pack_manifest 與 catalog
- **state:** 等待確認
- **basis:** → O1

`src/core/definition_iii.ts`：`pack_module` 移除 `hooks`、`global_init`、`world_init`，保留為 registry 條目；新增 `catalog { registry, handlers, create_states }` 與 `pack_manifest { pack_id, provides, on, create_state, patch }`。

**沿革**

- H1 · 2026-10-14 01:17 決斷 —— 採納 QA 2610140017 結論（human: wVQ88Soi2Il9）
- H2 · 2026-10-14 01:17 落地 —— 完成型別替換（agent: claude） → O2

### 2 Runtime：compose 與 pure_world 單一寫入路徑
- **state:** 等待確認
- **basis:** → O1

`src/world.ts`：`compose(manifests)` 合併 provides / on 後依序執行 patch；`pure_world(catalog, space, id?)` 提供 `submit` / `undo` / `redo` / `jump_*` / `delete_history_node`，皆經 `commit` 以 LCA 推導 change_set 並發出 `core:committed(world, change_set)`。移除 `inject_hook`、`trigger`、`current_hook`。

**沿革**

- H1 · 2026-10-14 01:17 決斷 —— 採納 QA 2610140017 結論（human: wVQ88Soi2Il9）
- H2 · 2026-10-14 01:17 落地 —— 完成 compose 與 commit（agent: claude） → O2

### 3 Packs 與入口改用 manifest
- **state:** 等待確認
- **basis:** → O1

各 pack 的 `global_init` / `world_init` 改為 `export const manifest`；`vanilla_alpha` 移除 10 個 hook 宣告與轉發鏈；`std_world` 只保留 create / delete / move / select_recipe，改呼叫 `submit`；`src/main.ts` 改用 `compose`；`src/README.md` 改寫為新架構與不變式。

**沿革**

- H1 · 2026-10-14 01:17 決斷 —— 採納 QA 2610140017 結論（human: wVQ88Soi2Il9）
- H2 · 2026-10-14 01:17 落地 —— 完成 packs、入口與 README 替換（agent: claude） → O2

### 4 測試替換
- **state:** 等待確認
- **basis:** → O2

刪除測試舊 API 的 `tests/core_v3_hooks.test.ts`；新增 `tests/pack_manifest.test.ts`，覆蓋 compose 順序與 patch、submit / undo / redo / jump 的 change_set、跨分支 jump、未移動不發事件、刪除歷史節點、多世界隔離。

**沿革**

- H1 · 2026-10-14 01:17 決斷 —— 以新設計測試取代舊 hook 測試（agent: claude）
- H2 · 2026-10-14 01:17 落地 —— 完成並通過（agent: claude） → O2
