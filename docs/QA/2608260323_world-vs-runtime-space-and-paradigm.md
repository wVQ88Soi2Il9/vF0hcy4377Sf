# 2608260323_world-vs-runtime-space-and-paradigm

- **status:** resolved
- **topic:** runtime 改名 world、map 改名 space 之語意與 class world / class space 選型雙向論證

## 提問與回答

### Q1 · 2026-08-26 03:22（human: wVQ88Soi2Il9）
1. 不要叫 `runtime`，改為 `world`（比較合胃口）。
2. `map` 與此同時是不是該改名 `space`？對齊數學的名詞。
3. 關於型別與架構選型，應該先決定要用 `interface`、`type` 還是 `class`？

### A1 · 2026-08-26 03:23（agent: gemini-3.7-flash-medium）

#### 1. `runtime` → `world`：極佳的遊戲領域模型收斂
- `runtime` 是電腦科學底層名詞，強調「程式執行階段」；而 `world` 是遊戲與模擬領域的核心本體。
- 一個 **`world`** 完美封裝了：
  - **`space`（幾何空間）**：多維座標、空間雜湊、裝置佈局。
  - **`history_tree`（時間歷史）**：分支時間軸、Undo/Redo、狀態快照。
  - **`registry`（宇宙法則/物質）**：物品、配方、裝置類別定義。
- 「世界切換（Switch World）」、「多重平行世界（Multi-World / Parallel Worlds）」之語意遠比「切換 runtime 實例」更直觀生動。

---

#### 2. `map` → `space`：數學對齊與避免 JS 語義衝突
- **避開 JavaScript 關鍵字混淆**：
  - JS 內建 `Map`（鍵值映射集合）與陣列 `array.map()`，先前程式碼中常出現 `new Map<number, device>()` 與變數 `map: game_map` 混淆的問題。
- **數學本質契合**：
  - 專案核心特點是支援任意 N 維度（`dimension`）、超立方體幾何、空間雜湊（Spatial Hash）、相機超平面切片投影。
  - 在數學上，此容器即為離散網格座標所構築的「空間（Vector / Grid Space）」，命名為 `space`（或 `game_space`）在語意上完全對齊數學本質。
- **「時空與法則」三位一體心智模型**：
  $$\text{World} = \text{Space (空間)} + \text{History (時間)} + \text{Registry (法則)}$$

---

### Q2 · 2026-08-26 03:34（human: wVQ88Soi2Il9）
我們先從 `class` 開始嘗試：`world = space + history + registry`。

### A2 · 2026-08-26 03:35（agent: gemini-3.7-flash-high）

針對以 `class world` 作為聚合核心實體的架構選型，依據雙向論證原則進行全面評估：

#### 贊同採納的理由（Why we should）
1. **極高內聚力與人體工學（High Cohesion & Ergonomics）**：
   - 呼叫端體驗流暢自然，直覺調用 `world.execute(cmd)`、`world.undo()`、`world.redo()`、`world.jump_to(uid)`。
   - `world` 內部直接綁定自身的 `space`、`history` 與 `registry`，杜絕外部在呼叫純函式時意外把 A 世界的 `history_tree` 傳給 B 世界的 `space` 操作（消除跨世界狀態錯配風險）。
2. **多實例隔離與生命週期管理更乾淨（Clean Multi-Instance Isolation）**：
   - 建立新世界只需 `const w = new world({ dimension: 3 })`，各自持有獨立狀態與相機焦點，不依賴任何模組級隱式全域變數。
3. **物件導向能力擴充性（OOP Polymorphism & Extension）**：
   - 未來可藉由衍生類別或組合（如 `readonly_world`、`simulation_world`、`diff_world`）擴充特殊用途世界。
4. **與 `abstract class device` 風格統一**：
   - 專案在實體層已採用 `abstract class device`，世界層採用 `class world` 保持統一的 OOP 心智模型。

---

#### 反對／保留／潛在代價的理由（Why we shouldn't）
1. **Core 零副作用與純演算法純度面臨挑戰**：
   - 若將 Undo Tree 分支重放（`find_lca`、`jump_to_node`）與空間運算全塞入 `class world` 方法中，容易導致演算法與實體狀態耦合（`this.space` 隱式突變），降低純演算法獨立單元測試與無狀態重放的能力。
2. **狀態序列化／存檔還原成本（Serialization Overhead）**：
   - 純資料物件（POJO/Interface）可直接 `JSON.stringify`，而包含大量實例方法的 `class` 必須額外設計標準化的 `serialize()` / `deserialize()` 才能支援存檔與 Web Worker 傳遞。
3. **事件監聽與 UI 傳遞時的 `this` 綁定陷阱**：
   - 在 UI 事件或 CLI Callback 傳遞 `world.undo` 時，若未綁定 `this` 易產生執行期 `undefined` 錯誤。
4. **指令（Command）反向依賴風險**：
   - 可逆指令（`space_command`）的 `execute(space)` 與 `inverse(space)` 應僅依賴空間幾何；若指令方法依賴整個 `world`，會破壞指令的最小原子性。

---

### Q3 · 2026-08-26 03:55（human: wVQ88Soi2Il9）
先把 `space` 改成 `class`。

### A3 · 2026-08-26 03:56（agent: gemini-3.7-flash-high）

針對將 `space` 由純資料介面重構為實體類別 `class space` 之雙向論證評估：

#### 贊同採納的理由（Why we should）
1. **空間狀態與實體異動高度內聚（Encapsulation & High Cohesion）**：
   - 空間維度、尺寸、UID 遞增器、裝置陣列與增刪改操作（`create_device`, `delete_device`, `move_device`, `select_recipe`）完全收斂於實例方法中，呼叫端享有 `sp.create_device(...)`、`sp.delete_device(uid)` 之直接直觀語意。
2. **Hooks 觸發點內聚保障**：
   - 裝置建立、移動、刪除時的 Core Hooks 觸發邏輯直接內聚於 `class space` 方法內部，杜絕外部繞過 Hooks 造成狀態與 UI 渲染不同步之漏洞。
3. **三層 OOP 領域階層完整統一**：
   - 形成清晰一貫的領域物件階層：`world (class)` $\rightarrow$ `space (class)` $\rightarrow$ `device (class)`。

#### 反對／保留／潛在代價的理由（Why we shouldn't）
1. **純資料快照與序列化代價**：
   - 將 `space` 轉為類別後，進行深拷貝或 JSON 存檔序列化時需透過資料提取或反序列化工廠重建類別實例。
2. **純函式封裝相容需求**：
   - 為了相容外部或既有函式風格呼叫（`create_device(sp, ...)`），`space_manager.ts` 需提供薄轉發包裝層。

---

## 結論

1. **命名全面定案**：`runtime` $\rightarrow$ **`world`**，`map` $\rightarrow$ **`space`**。
2. **三位一體實體模型**：正式確立 $\text{World} = \text{Space} + \text{History} + \text{Registry}$。
3. **OOP 領域層級定案**：全面採用 `class world` 與 `class space` 作為核心實體類別，內聚狀態異動與 Hooks 觸發，同時保留純函式轉發與可逆指令契約，兼具物件導向高內聚性與底層純粹性。

#world #runtime #space #architecture
