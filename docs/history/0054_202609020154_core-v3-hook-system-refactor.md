# 0054_202609020154_core-v3-hook-system-refactor

- **status:** in-progress
- **prev:** ./0053_202608260315_core-vs-runtime-architecture-boundaries.md
- **skill:** plan-history v3

## 主題簡述

依據使用者明確定義之 5 階段生命週期架構，重構 `src/core_v3` 的 Hook 系統：
```text
1. init
2. complete registry
3. complete empty hook list = Map<namespace, Map<id, callbacks[]>>
4. new world
5. inject callbacks
```
嚴格遵守「每次只動一小部分」原則，每次變更僅聚焦單一檔案之最小增量。

---

## 觀察與推論

### O1 · 2026-09-02 01:54:00+08:00 — 全域 Hook 規範與 World 實例回呼之職責分離
確立「Hook List 結構為全域靜態槽位規範、Callback 注入為世界實例獨立持有」的心智模型。

### O2 · 2026-09-02 01:54:30+08:00 — 完成 definition_i.ts Hook 回呼與結構型別定義
在 `src/core_v3/definition_i.ts` 定義 `hook_callback` 型別，並以 `hook_callback[]` 表達 `hook_list = Map<string, Map<string, hook_callback[]>>`，維持 Level I 純契約。

### O3 · 2026-09-02 02:02:00+08:00 — 完成 pack_module.hooks: namespaced_id[] 宣告與 register_pack 純粹化
在 `src/core_v3/definition_iii.ts` 為 `pack_module` 擴充 `hooks?: namespaced_id[]` 欄位；`register_pack` 回歸最簡 `registry.packs.set`，Pack 註冊完畢即構成完整的 Registry（階段 1 & 2）。

### O4 · 2026-09-02 02:46:00+08:00 — 確立 5 階段生命週期架構分解
由使用者確立 5 階段生命週期順序（init -> complete registry -> complete empty hook list -> new world -> inject callbacks），各階段職責完全單一且正交。

### O5 · 2026-09-02 02:48:00+08:00 — 完成 hooks.ts 之 build_empty_hook_list 實作
在 `src/core_v3/hooks.ts` 實作 `build_empty_hook_list(registry: pack_registry): hook_list`，走訪已就緒之 registry 產出完整的全域全空槽位模板。

### O6 · 2026-09-02 02:51:00+08:00 — 完成 pure_world 建構子內聚初始化獨立槽位
在 `src/core_v3/world.ts` 建構子內部直接由 template 生成世界專屬槽位；`src/core_v3/hooks.ts` 徹底刪除多餘的 `create_world_hook_list` 中介函式，消除模組跨檔案依賴。

### O7 · 2026-09-02 02:54:00+08:00 — 完成 inject_world_hook 單行無條件注入並清除舊有防禦殘留
在 `src/core_v3/hooks.ts` 中將 `inject_world_hook` 徹底替換為單行 `target_world.current_hook.get(ns)!.get(id)!.push(cb)`，清除舊有 `if (!pack_hooks)` 等防禦殘留。

### O8 · 2026-09-02 03:02:00+08:00 — pure_world 建構子改採原生 structuredClone 深拷貝槽位
將 constructor 內手寫之雙層迴圈替換為單行 `this.current_hook = template ? structuredClone(template) : new Map()`，消除命令式樣板代碼。

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

### 2 擴充 Pack 模組契約並建立完整 Registry (Complete Registry in definition_iii.ts)
- **state:** 等待確認
- **basis:** → O1, O3

在 `src/core_v3/definition_iii.ts` 的 `pack_module` 擴充 `hooks?: namespaced_id[]` 宣告欄位，Pack 註冊進 registry 即天然具備全域 Hook 規範清單（階段 1 與 2 就緒）。

**沿革**

- H1 · 2026-09-02 01:54 決斷 —— pack_module 宣告 hooks: namespaced_id[]，收斂由 registry 持有全域規範（human: wVQ88Soi2Il9）
- H2 · 2026-09-02 02:02 落地 —— 完成 pack_module.hooks: namespaced_id[] 擴充與 registry.packs 收斂（agent: gemini-3.7-flash-medium） → O3

### 3 實作階段 3 之全域空槽位清單建構 (Build Complete Empty Hook List in hooks.ts)
- **state:** 等待確認
- **basis:** → O4, O5

在 `src/core_v3/hooks.ts` 實作階段 3 工具函式：
- `build_empty_hook_list(registry: pack_registry): hook_list`：遍歷 Registry 中所有 Pack 的 `hooks` 宣告，建立全域完整的 `Map<namespace, Map<id, []>>` 模板。此清單內部皆為乾淨空陣列，作為世界生成時的標準槽位藍圖。

**沿革**

- H1 · 2026-09-02 02:46 決斷 —— 確立階段 3 build_empty_hook_list 從 registry 建構完整全空槽位模板（human: wVQ88Soi2Il9）
- H2 · 2026-09-02 02:48 落地 —— 實作 build_empty_hook_list 完成階段 3 全域槽位清單建構（agent: gemini-3.7-flash-high） → O5

### 4 實作階段 4 之世界專屬空槽位生成與 world 接軌 (New World Hook Slots in world.ts)
- **state:** 等待確認
- **basis:** → O4, O6

在 `src/core_v3/world.ts` 的 `pure_world` 建構子接收 `template?: hook_list`，內部直接由 template 內聚初始化該世界專屬的獨立槽位，消除多餘中介函式。

**沿革**

- H1 · 2026-09-02 02:46 決斷 —— 確立階段 4 讓各世界持有獨立回呼骨架（human: wVQ88Soi2Il9）
- H2 · 2026-09-02 02:57 落地 —— pure_world 建構子內聚初始化獨立槽位，刪除 hooks.ts 多餘函式（agent: gemini-3.7-flash-high） → O6
- H3 · 2026-09-02 03:02 落地 —— 改採原生 structuredClone 單行深拷貝槽位（agent: gemini-3.7-flash-high） → O8

### 5 實作階段 5 之單行無條件回呼注入 (Inject Callbacks in hooks.ts)
- **state:** 等待確認
- **basis:** → O4, O7

在 `src/core_v3/hooks.ts` 實作階段 5 注入函式：
- `inject_world_hook(target_world: pure_world, target_hook: namespaced_id, callback: hook_callback): void`：
  因前兩階段已保證槽位 100% 存在，注入端實現極致單行：
  `target_world.current_hook.get(target_hook.namespace)!.get(target_hook.id)!.push(callback);`
  無任何 `if (!has)` 或防禦性補洞邏輯。

**沿革**

- H1 · 2026-09-02 02:46 決斷 —— 確立階段 5 inject_world_hook 無判斷單行注入（human: wVQ88Soi2Il9）
- H2 · 2026-09-02 02:54 落地 —— 替換為單行無條件注入並徹底清理舊防禦程式碼（agent: gemini-3.7-flash-high） → O7

### 6 整合測試驗證 5 階段生命週期全流程與多世界隔離性 (Integration Verification)
- **state:** 待實作
- **basis:** → O4

撰寫自動化測試腳本，完整串連 5 階段：
1. `init`：建立 pack_registry。
2. `complete registry`：註冊多個宣告 hooks 的 Pack。
3. `complete empty hook list`：呼叫 `build_empty_hook_list`，驗證全域所有槽位均初始化為空陣列。
4. `new world`：建立 `world_1` 與 `world_2`，分別注入專屬槽位。
5. `inject callbacks`：向 `world_1` 單行注入 callback，驗證 `world_1.trigger()` 執行回呼，而 `world_2.trigger()` 靜默隔離。

**沿革**

- H1 · 2026-09-02 02:46 決斷 —— 建立 5 階段全流程驗證測試（human: wVQ88Soi2Il9）
