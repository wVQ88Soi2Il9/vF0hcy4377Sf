# 0055_202609022215_core-hook-multi-world-refactor

- **status:** in-progress
- **prev:** ./0054_202609020154_core-v3-hook-system-refactor.md
- **skill:** plan-history v3

## 主題簡述

針對現有 `src/core/hooks.ts` 依賴全域靜態陣列而無法支援多世界隔離的問題，依據使用者的 4 階段生命週期，將 Hook 系統重構至與 `world` 實例綁定：

1. **init**: load all packs in order（依序載入並註冊所有 Pack）。
2. **determine all possible hooks**: (empty hook list) 建構全域唯一的 Hook 槽位藍圖。
3. **create a new world**: 每個世界實體持有自己專屬、獨立的 Hook 清單（由空藍圖深拷貝）。
4. **inject callbacks**: 世界運行期間，所有 Pack 只能將回呼函式明確注入到「特定世界」的 Hook 清單中。

---

## 觀察與推論

### O1 · 2026-09-02 22:15:00+08:00 — 全域靜態陣列的隔離性問題
目前的 `src/core/hooks.ts` 將 Hooks 儲存於 `const hooks` 全域靜態物件中。當支援多個 `world` 實例同時存在時，全域 Hook 將導致來自 `world A` 的操作觸發了原定給 `world B` 的回呼，破壞多世界間的隔離。

### O2 · 2026-09-02 22:18:00+08:00 — 使用者指定的 4 階段生命週期架構
為了將 Hook 改為 `world` 綁定，需要重新確立 Hook 註冊生命週期：
1. **init**: 依序載入各 Pack。
2. **determine possible hooks**: 總結所有可用的 Hook，建構一份全空的藍圖（Blueprint）。
3. **create world**: 建構 `world` 時，複製此空藍圖作為該世界的專屬 Hook 列表。
4. **inject callbacks**: 實例運行期間，各 Pack 明確指定要注入回呼的 `world`。

---

## 待辦

### 1 定義 Hook 清單藍圖機制 (Define Empty Hook List Blueprint)
- **state:** 待實作

在 `src/core/types.ts` 或 `src/core/hooks.ts` 中：
- 定義完整的 Hook 清單型別（例如 `type hook_list = Map<string, Map<string, Function[]>>` 或等效結構）。
- 擴充 `pack_module` 的介面，允許 Pack 宣告它支援哪些 Hooks。
- 實作在所有 Pack 載入完畢後，掃描 `pack_registry` 產生一組「全空陣列」的 Hook 全域槽位藍圖。

### 2 賦予 World 獨立 Hook 實例 (World Unique Hook List)
- **state:** 待實作

修改 `src/world.ts` 的 `class world`：
- 為 `class world` 增加 `hooks` 屬性。
- 在 `world` 建構子中，以 `structuredClone` 等深拷貝方式，從全域藍圖複製一份獨立的 Hook 槽位清單，確保多個 `world` 之間的 Hook 註冊完全隔離。

### 3 替換全域注入為 World 綁定注入 (Bind Callbacks to Specific World)
- **state:** 待實作

重構 `src/core/hooks.ts` 中現有的全域靜態注入與觸發 API：
- 廢棄靜態陣列（例如 `hooks.on_device_create`）。
- 實作明確綁定 World 的注入介面，如 `inject_world_hook(target_world, hook_id, callback)`。
- 將 `trigger_*` 系列函式改為由 `target_world` 發起（或傳入 `target_world`），並只執行該世界專屬清單內的回呼函式。

### 4 遷移現有 Pack 並驗證隔離性 (Migrate & Verify)
- **state:** 待實作

- 將現有依賴 Hook 的模組（如 `basic_renderer`、`shirones_ui` 等）的訂閱邏輯遷移至新的 `world` 綁定機制。
- 新增或修改測試，驗證兩個不同 `world` 之間觸發 Hook 時的回呼隔離性。
