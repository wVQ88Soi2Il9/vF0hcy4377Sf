# 0054_202609020154_core-v3-hook-system-refactor

- **status:** in-progress
- **prev:** ./0053_202608260315_core-vs-runtime-architecture-boundaries.md
- **skill:** plan-history v3

## 主題簡述

依據使用者明確指示之架構核心：「**Hook list is global, but inject callback is per-world (方式 B 顯式注入)**」，重構 `src/core_v3` 的 Hook 系統：
1. **全域靜態 Hook 清單 (Global Hook List)**：系統 Init 時建立全域 registry 與 empty hook list，各 Pack 宣告並注入其提供的 Hook 槽位（定義整個系統支援哪些合法 Hook 點位）。
2. **世界獨立回呼注入 (Per-World Callback Injection - 方式 B)**：回呼函式（callbacks）依附於各個 `world` 實例。外部透過顯式呼叫注入至指定目標 World，各世界的事件觸發與監聽互不干擾。

嚴格遵守「每次只動一小部分」原則，每次變更僅聚焦單一檔案之最小增量。

---

## 觀察與推論

### O1 · 2026-09-02 01:54:00+08:00 — 全域 Hook 規範與 World 實例回呼之職責分離
若回呼函式為全世界共用，會導致多世界場景下事件互相污染；若 Hook 清單完全由世界私有，則各世界無法享有 Pack 宣告的一致規格。確立「Hook List 為全域靜態槽位規範、Callback 注入為世界實例獨立持有」的心智模型，並採方式 B（顯式向目標 World 注入回呼）。

### O2 · 2026-09-02 01:54:30+08:00 — 完成 definition_i.ts Hook 回呼與結構型別定義
在 `src/core_v3/definition_i.ts` 定義 `hook_callback` 型別，並以 `hook_callback[]` 表達 `hook_list`，維持 Level I 純契約。

### O3 · 2026-09-02 02:02:00+08:00 — 完成 pack_module.hooks: namespaced_id[] 宣告與 register_pack 純粹化
在 `src/core_v3/definition_iii.ts` 為 `pack_module` 擴充 `hooks?: namespaced_id[]` 欄位；`register_pack` 回歸最簡 `registry.packs.set`，使 Pack 註冊進 registry 即完整具備全域 Hook 宣告資訊。

### O4 · 2026-09-02 02:03:00+08:00 — 完成 hooks.ts 之 inject_world_hook 顯式注入函式
在 `src/core_v3/hooks.ts` 實作 `inject_world_hook(target_world, target_hook, callback)`，由外部顯式向特定 World 實例的 `current_hook` 注入回呼，並在 `src/core_v3/index.ts` 匯出。

---

## 待辦

### 1 定義 Hook 回呼與資料結構契約 (Hook Types & Callback Contract in definition_i.ts)
- **state:** 等待確認
- **basis:** → O1, O2

在 `src/core_v3/definition_i.ts` 明確定義基礎型別：
- `hook_callback = (...args: any[]) => void;`
- `hook_list = Map<string, Map<string, hook_callback[]>>;`
維持純契約定位，零全域活體狀態。

**沿革**

- H1 · 2026-09-02 01:54 決斷 —— 確立 Hook 回呼與巢狀 Map 資料結構純契約（human: wVQ88Soi2Il9）
- H2 · 2026-09-02 01:54 落地 —— 完成 hook_callback 與 hook_list 型別定義（agent: gemini-3.7-flash-high） → O2

### 2 擴充 Pack 模組契約並建立全域 Hook 容器與槽位註冊 (Global Hook Slot Registry)
- **state:** 等待確認
- **basis:** → O1, O3

在 `src/core_v3/definition_iii.ts` 的 `pack_module` 擴充 `hooks?: namespaced_id[]` 宣告欄位，Pack 註冊進 registry 即天然具備全域 Hook 規範清單。

**沿革**

- H1 · 2026-09-02 01:54 決斷 —— pack_module 宣告 hooks: namespaced_id[]，收斂由 registry 持有全域規範（human: wVQ88Soi2Il9）
- H2 · 2026-09-02 02:02 落地 —— 完成 pack_module.hooks: namespaced_id[] 擴充與 registry.packs 收斂（agent: gemini-3.7-flash-medium） → O3

### 3 實作 World 實例 Callback 顯式注入與事件派發 (Per-World Hook Injection & Trigger)
- **state:** 等待確認
- **basis:** → O1, O4

在 `src/core_v3/hooks.ts` 實作方式 B 的世界注入函式：
- `inject_world_hook(target_world: pure_world, target_hook: namespaced_id, callback: hook_callback): void`：顯式向指定 World 實例的 `current_hook` 槽位注入回呼。
並確認 `pure_world.trigger()` 依賴實例自身 `current_hook`，確保事件與回呼嚴格隔離於各自世界。
在 `src/core_v3/index.ts` 匯出 `hooks.ts`。

**沿革**

- H1 · 2026-09-02 01:54 決斷 —— 依方式 B 實作 inject_world_hook 顯式向世界注入回呼（human: wVQ88Soi2Il9）
- H2 · 2026-09-02 02:03 落地 —— 實作 inject_world_hook 並於 index.ts 匯出（agent: gemini-3.7-flash-medium） → O4

### 4 整合測試驗證全域 Hook 槽位與 World 實例隔離性 (Integration Verification)
- **state:** 待實作
- **basis:** → O1

撰寫驗證測試，驗證：
1. 建立全域 registry 與全域 hook_list，Pack 成功注入槽位。
2. 建立 `world_a` 與 `world_b`，分別顯式注入不同的 callbacks。
3. `world_a` 觸發事件時，僅執行 `world_a` 之 callbacks，`world_b` 不受影響。

**沿革**

- H1 · 2026-09-02 01:54 決斷 —— 建立多世界隔離性驗證測試（human: wVQ88Soi2Il9）
