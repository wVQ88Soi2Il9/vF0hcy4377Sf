# 2608300135_inside-what-is-a-world-outside-current-worlds

- **status:** resolved
- **topic:** 核心邊界定案：Core 內部定義「What is a world」、外部管理「Current worlds (may > 1)」

## 提問與回答

### Q1 · 2026-08-30 01:33（human: wVQ88Soi2Il9）
我們可以先往方向 A 靠攏：
- 外面是 current worlds (may more than 1)
- 裡面是 what is a world

### A1 · 2026-08-30 01:34（agent: gemini-3.7-flash-high）

這句話一針見血地確立了整個引擎最核心的邊界哲學與心智模型：

$$\text{Core (內部)} = \text{What is a world (世界的本質與行為契約)}$$
$$\text{World Manager (外部)} = \text{Current worlds (記憶體中活著的實例與焦點管理)}$$

---

### 一、分層職責與邊界架構

#### 1. Core 內部（`src/core/`）：世界的本質（What is a world）
Core 保持 **100% 零全域實例、零外部狀態**，專注於描述構成一個遊戲世界所需的所有時空法則與實體類別：
- **`types.ts`**：底層純契約（純 `interface` / `type`，零內部 import）。
- **`device.ts`**：`abstract class device`（實體多型基類）。
- **`space.ts`**：`class space`（空間幾何實體）。
- **`history.ts`**：Undo Tree 分支時間軸純演算法。
- **`commands.ts`**：空間可逆指令工廠。
- **`registry.ts`**：法則與物品定義容器（`pack_registry`）。
- **`hooks.ts`**：事件廣播與訂閱系統。
- **`world.ts`**：`class world` 頂層聚合實體（$\text{World} = \text{Space} + \text{History} + \text{Registry}$，提供流暢的 OOP 實例方法）。
- **`index.ts`**：`@/core` 唯一公開進入點。

#### 2. Core 外部（`src/world.ts`）：活體實例管理（Current worlds, may > 1）
持有應用生命週期中的活體資料，負責多世界實例的切換與調度：
- `_worlds: Map<string, world>`（多世界實例倉庫）。
- `_active_world: world | undefined`（當前操作焦點指標）。
- 提供 `create_world`, `get_world`, `set_active_world`, `get_active_world` 等多實例調度 API。
- 提供針對當前 `_active_world` 的極簡偏函式捷徑（`undo()`, `execute_command()`）。

---

### 二、架構優勢雙向論證 (Balanced Advocacy)

#### 贊同採納的理由（Why we should）
1. **概念邊界極度純粹**：
   - 任何想要了解「世界如何運作」的開發者只需看 `src/core/`；想要管理「多重平行世界」的開發者只需看 `src/world.ts`。
2. **`types.ts` 徹底擺脫逆向依賴**：
   - `types.ts` 作為 Layer 0 純契約，完全不需要 `import` 任何具體類別，整個 Core 形成完美單向 DAG。
3. **支援無上限的多世界擴充**：
   - UI 或 CLI 可以同時連接或在多個獨立的世界實例間無縫切換，彼此的空間幾何與時間分支完全隔離。

#### 反對／潛在代價的理由（Why we shouldn't）
1. **內部模組重整成本**：
   - 需要將目前分散在 `types.ts` 與 `space_manager.ts` 的定義依照 `device.ts`、`space.ts`、`world.ts`、`history.ts` 進行一次性標準化重整。
2. **名詞理解門檻**：
   - 需要區分 `@/core` 匯出的「實體類別 `class world`」與根目錄 `@/world` 匯出的「多世界管理模組（Active World Manager）」。

---

## 結論

正式拍板定案「**內部 What is a world（Core Layer 4 聚合實體）+ 外部 Current worlds（多實例管理中心）**」架構，依此標準推進 Core 內部重構與單向 DAG 拓撲演進。

#world #architecture
