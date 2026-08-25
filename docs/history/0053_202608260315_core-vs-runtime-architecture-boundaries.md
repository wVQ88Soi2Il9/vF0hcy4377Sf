# 0053_202608260315_core-vs-runtime-architecture-boundaries

- **status:** in-progress
- **prev:** ./0052_202608260133_cli-syntax-redesign-and-vector-tokens.md
- **skill:** plan-history v3

## 主題簡述

依據 QA 0006 與 QA 0007 確立之架構共識，推進 Core、World 與 Vanilla 的職責邊界收斂、多世界實例（Multi-World）架構演進，以及「空間（Space）」數學名詞與 `class world = space + history + registry` 實體範式：
1. **名詞重構（`world` 與 `space`）**：
   - 將冷硬的 `runtime` 正式更名為遊戲領域核心概念 **`world`**（實體類別 `class world`，全域容器/模組為 `src/world.ts`）。
   - 將易與 JS `Map` 混淆的 `game_map` / `map` 正式更名為數學空間語意之 **`space`**（型別 `interface space`，管理器為 `src/core/space_manager.ts`），形成 $\text{World} = \text{Space} + \text{History} + \text{Registry}$ 的三位一體心智模型。
2. **實體類別與 Core 純演算法分層架構**：
   - **實體層**：以 `class world` 聚合 `space`, `history`, `registry`，對外提供高內聚且具人體工學的 `world.execute(cmd)`、`world.undo()`、`world.jump_to()` 物件導向介面。
   - **核心層**：Core 保持純資料契約（`interface space`、`interface history_tree`）與純函式演算法（`undo`、`jump_to_node` 等），可逆指令 `space_command` 僅依賴 `space`。
3. **World 多實例化與 Active World 管理**：
   - 將 `src/world.ts` 升級為支援建立、銷毀與切換世界實例的管理器，並提供對當前 Active World 轉發的便利捷徑。
4. **Vanilla 業務語意與擴充容器收斂**：
   - 明確區分 Undo Tree 拓撲跳轉核心演算法（Core）與業務語意操作（Vanilla 透過 `other_info['vanilla']` 擴充），解除 Pack 對全域單例的硬依賴。
5. **CLI / UI 與多世界連接解耦**：
   - 確保 N 個 UI / CLI 介面可動態掛載與操作指定之 `world` 實例。

---

## 觀察與推論

### O1 · 2026-08-26 03:15:00+08:00 — 歷史操作與全域狀態邊界模糊及多實例演進需求
在 QA 0006 中釐清了 Core（純型別/純演算法）、Runtime（全域參數 Currying/實例容器）與 Vanilla（`other_info['vanilla']` 擴充）三者的劃分準則。現有狀態容器持有單一全域變數，若需支援多地圖或多歷史樹環境，需抽象化實例容器，使 Core 保持 100% 無狀態。

### O2 · 2026-08-26 03:23:00+08:00 — 名詞對齊（world / space）與 interface 純函式範式確立
在 QA 0007 中確立名詞重構：`runtime` $\rightarrow$ `world`，`map` $\rightarrow$ `space`，消除 JS 內建 `Map` 混淆並對齊 N 維空間幾何本質。

### O3 · 2026-08-26 03:35:00+08:00 — class world = space + history + registry 雙向論證與分層架構定案
在 QA 0007 Q2/A2 雙向論證中確立採「`class world` 實體門面 + Core 純演算法」方案：以 `class world` 封裝時空與法則三位一體實體，底層 Core 維持純函式無狀態特性。

### O4 · 2026-08-26 03:41:00+08:00 — 完成 Core 層 space 型別與純函式管理器重構
完成 `src/core/` 全面重構：在 `types.ts` 定義 `space` 與 `space_command`（保留過渡相容別名），新增 `space_manager.ts` 管理空間幾何與裝置異動，全面更新 `commands.ts`、`history_manager.ts`、`hooks.ts` 與 `index.ts` 公開進入點，Core 保持 100% 零全域狀態與純函式演算法無副作用。

---

## 待辦

### 1 重命名 Core 空間型別為 space 並維持純函式演算法 (Space Interface & Pure Core Algorithms)
- **state:** 等待確認
- **basis:** → O1, O2, O3, O4

在 `src/core/types.ts` 將 `game_map` 重命名為 `space`（並重構 `map_manager.ts` 為 `space_manager.ts`、`map_command` 為 `space_command`），確認 Core 所有歷史演算法與空間操作皆為接受 `space` / `history_tree` 顯式參數之純函式，指令不依賴外部整個 world 物件。

**沿革**

- H1 · 2026-08-26 03:15 決斷 —— 建立 Core 容器契約與純函式收斂待辦（human: wVQ88Soi2Il9）
- H2 · 2026-08-26 03:23 決斷 —— 依據 QA 0007 將 map 改名為 space，runtime 改名為 world（human: wVQ88Soi2Il9） → O2
- H3 · 2026-08-26 03:35 決斷 —— 確立 Core 維持無狀態純函式與 space_command 最小依賴原則（human: wVQ88Soi2Il9） → O3
- H4 · 2026-08-26 03:41 落地 —— 完成 Core 內 space/space_command 重命名與 space_manager.ts 重構（agent: gemini-3.7-flash-high） → O4

### 2 實作 class world 實體類別與多世界管理 (Implement class world & Multi-World Management)
- **state:** 待實作
- **basis:** → O1, O2, O3

在 `src/world.ts`（原 `src/runtime.ts`）實作 `class world`（聚合 `space`、`history`、`registry`，提供 `execute()`, `undo()`, `redo()`, `jump_to()` 等方法代理 Core 純函式），並實作 Active World 管理與便利函式匯出。

**沿革**

- H1 · 2026-08-26 03:15 決斷 —— 建立多實例管理與捷徑轉發待辦（human: wVQ88Soi2Il9）
- H2 · 2026-08-26 03:23 決斷 —— 依據 QA 0007 將檔案重命名為 world.ts 並將概念收斂為 Multi-World（human: wVQ88Soi2Il9） → O2
- H3 · 2026-08-26 03:35 決斷 —— 確定採用 class world = space + history + registry 實體類別模式（human: wVQ88Soi2Il9） → O3

### 3 釐清 Vanilla 歷史擴充邊界並適配 space / world 型別 (Adapt Vanilla History Semantics to space & world)
- **state:** 待實作
- **basis:** → O1, O2, O3

檢視 `src/packs/vanilla/history.ts`，將 `pinned`、`merged_from` 與 `delete_branch` 正式收斂為 `other_info['vanilla']` 擴充與組合操作，並解除對全域單例的隱式耦合，使其支援傳入顯式 `history_tree` 或 `world` 實例。

**沿革**

- H1 · 2026-08-26 03:15 決斷 —— 建立 Vanilla 歷史擴充邊界收斂待辦（human: wVQ88Soi2Il9）
- H2 · 2026-08-26 03:23 決斷 —— 依據 QA 0007 更新對齊 space 與 world 型別引用（human: wVQ88Soi2Il9） → O2
- H3 · 2026-08-26 03:35 決斷 —— 支援接收 world 實例或純 history_tree 進行標記與分支操作（human: wVQ88Soi2Il9） → O3

### 4 跨模組依賴更新、過渡設施清理與 CLI / UI 整合驗證 (Cross-Pack Migration, Transitional Cleanup & Validation)
- **state:** 待實作
- **basis:** → O1, O2, O3

更新所有引用原 `@/runtime` 與 `game_map` 的下游 Pack（`basic_renderer`、`basic_ui`、`cli_tool`、`layered_2d`、`ef`、`shirones_ui` 等）至 `@/world` 與 `space`，驗證 CLI 與 UI 在多 World 切換下之操作一致性與架構純度。並於遷移完成後**徹底清除所有 `// TODO: transitional` 標記項目**（移除 `game_map` / `map_command` / `create_map` 別名與刪除 `src/core/map_manager.ts`）。

**沿革**

- H1 · 2026-08-26 03:15 決斷 —— 建立整合驗證待辦（human: wVQ88Soi2Il9）
- H2 · 2026-08-26 03:23 決斷 —— 擴充涵蓋全 Pack 下游引用遷移與多世界切換驗證（human: wVQ88Soi2Il9） → O2
- H3 · 2026-08-26 03:35 決斷 —— 驗證 class world 實體在 UI/CLI 交互下的穩定性（human: wVQ88Soi2Il9） → O3
- H4 · 2026-08-26 03:44 決斷 —— 列管所有 TODO: transitional 過渡設施之強制清理任務（human: wVQ88Soi2Il9）
