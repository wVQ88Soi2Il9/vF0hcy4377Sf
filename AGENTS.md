---
description: Project conventions, architecture design, and coding guidelines
trigger: always_on
---

# Project Guidelines & Architecture

本文件為專案唯一的架構與開發規範（Single Source of Truth），所有開發與程式碼均須嚴格遵守。

---

## 1. 系統架構與邊界隔離 (Architecture & Boundary Isolation)

依賴關係嚴格單向：`packs` → `core`（基礎數學與空間工具收斂於 `@/packs/vanilla`，全域狀態容器收斂於 `@/runtime`）。

- **Core Layer**（`src/core/`）：純型別、純狀態容器、Hooks 系統、Undo Tree 歷程。零業務邏輯、**零全域狀態、零外部依賴**。唯一公開進入點為 `src/core/index.ts`（外部透過 `@/core` 引用）。包含全系統命令唯一真實來源（`pack_module.commands` 註冊至 `pack_registry`）。
- **Runtime Layer**（`src/runtime.ts`）：應用啟動期的全域實例容器（Map、Registry、History Tree）與捷徑操作（`execute_command`、`undo`、`jump_to_history` 等）。
- **Packs Layer**（`src/packs/`）：所有具體遊戲規則、基礎工具（`vanilla` 包含空間雜湊、空間與軸向數學、向量運算、命名空間解析）、渲染器、UI 介面、CLI 與資料包。每個 Pack 的唯一公開進入點為其 `index.ts`（外部透過 `@/packs/<pack_name>` 引用）。
- **CLI 與 UI 邊界規範**：
  - **`cli_tool` 純粹化**：僅作為純文字解析（Tokenizer、Flag Cleaner）與 Help 格式化工具，從 Core Registry 讀取指令工廠並執行。**嚴禁在 `cli_tool` 內嵌入遊戲領域業務邏輯，亦嚴禁要求其他 Pack 建立專屬 CLI 橋接檔**。
  - **`shirones_ui` 職責**：僅負責終端機 UI 面板渲染、DOM 事件處理與預設別名（Alias）映射。
- **邊界隔離與 Import 規範（Public Entrypoint Rule）**：
  - **模組邊界**：跨 module boundary 引用時，**必須一律從目標模組的 `index.ts` 公開進入點 import**（例：`import ... from '@/core'`、`import ... from '@/packs/<target_pack>'`）。
  - **禁止深層依賴**：**嚴禁直接依賴另一模組的內部實作檔案**（例：禁止 `import ... from '@/core/commands'`、禁止 `import ... from '@/packs/vanilla/overlap'`）。
  - **Hooks 保護**：外部禁止直接操作 `hooks` 物件，必須透過 `@/core` 導出的訂閱函式。

---

## 2. 2× 網格與端口座標系統 (2× Grid & Face Ports)

採用雙倍解析度網格，世界座標完全相等（`===`）即為連通：

- **裝置錨點 (`position`)**：全為偶數座標 $(2i, 2j, 2k, \dots)$，代表網格最小頂點（非幾何中心）。
- **單元佔據空間**：每個單元格佔據 $[x, x+2) \times [y, y+2) \times [z, z+2)$ 區間。
- **邊界端口 (`port`)**：落於單元格交界面中心，座標必為恰 1 軸偶數、其餘 $n-1$ 軸奇數。
- **校驗工具**：使用 `is_valid_device_position`（全偶數）與 `is_valid_port_position`（恰 1 偶數）驗證。

---

## 3. 物件導向與能力介面 (OOP & Capability Interfaces)

- **核心基類**：`src/core/types.ts` 定義 `abstract class device`，提供 `get_shape()` 與 `get_port()` 抽象方法。
- **垂直繼承（Is-A）**：使用 `extends` 建立具體類別階層與實作複用（例：`assembler extends base_device extends device`）。
- **水平能力（Can-Do）**：使用 `implements` 組合跨模組能力契約（例：`drawable_device`, `rotatable_device`）。
- **繪圖內聚**：裝置類別實作 `draw()` 方法，渲染器直接多型呼叫，無外部查表或 fallback 補齊。

---

## 4. Pack 模組與自動載入

- **目錄結構**：
  - `data/items.json`：靜態物品定義。
  - `recipes/*.ts`：動態配方模組（匯出包含 `evaluate(uid?)` 之 `recipe`）。
  - `devices/*.ts`：具體裝置類別（繼承 `device`）。
  - `index.ts`：初始化入口，匯出 `init_pack(): void`。
  - `$<rely_pack>/`：向被依賴 Pack 擴充之模組，由自身 `index.ts` 掃描並主動註冊。
- **自動掃描**：`src/packs/loader.ts` 自動載入上述檔案並呼叫 `init_pack()`。
- **物件導出**：Pack 對外介面統一封裝為命名物件（例：`export const basic_renderer = { ... }`）。

---

## 5. 分支歷史樹 (Undo Tree)

- **可逆指令**：所有地圖異動封裝為具備 `execute(map)` 與 `inverse(map)` 的 `map_command`。
- **非線性分支**：Undo 後執行新操作自動開闢新分支，不覆蓋歷史。
- **節點跳轉**：`jump_to_history` 透過 LCA 最短路徑重放轉換狀態；還原裝置時透過 `device_constructor` 註冊表重建類別實例。

---

## 6. CLI 命令列規範

- **嚴格語法**：
  - 參數一律採用**空格分隔**之位置參數（`cmd <arg1> <arg2> ...`）。
  - 座標向量一律使用**連續數字**（如 `create_device conveyor 4 4 0`、`move_device 1 6 6 0`），由解析器依據地圖維度嚴格驗證長度與偶數錨點。
  - 包含空格之字串才需以雙引號包覆（`"..."`）；相機軸向切片表示為 `d<n>=<val>`（如 `camera d2=0`）。
  - **別名原則**：別名一律由各 Pack 自行提供（如 `vanilla` 提供 `info`, `pin`, `delete-branch`；`layered_2d` 提供 `rotate`, `flip`；`basic_renderer` 提供 `camera`）；Core 與 History 導航不提供別名。
- **標準指令集**：`create_device`, `move_device`, `delete_device`, `select_recipe`, `info`, `camera`, `rotate`, `flip`, `undo`, `redo`, `jump_to_history`, `jump_to_prev_fork`, `jump_to_next_fork`, `jump_to_root`, `jump_to_leaf`, `delete-branch`, `delete_history_node`, `pin`, `history`, `help`。

---

## 7. 程式碼風格與工作原則 (Code Conventions)

- **風格規範**：
  - Allman 大括號（`{` 換行）。
  - 全小寫 `snake_case` 命名（變數、函式、型別、檔案、JSON key）。
  - 所有陳述句結尾強制加上分號 `;`，一律使用半形標點。
- **拒絕隱性補齊 (No Implicit Zero-Padding)**：嚴禁使用 `?? 0` 修補缺漏維度，向量長度須嚴格符合運算維度。
- **地圖 UID**：`game_map.uid` 從 `1` 開始遞增分配。
- **編譯檢查**：除非明確指示，Agent 不主動執行 `npx tsc -b`。
- **Git 執行**：收到 Git 指令指示時，自動完成 `git add`、生成 commit message 並執行 `git commit`。
- **Unknown 政策**：標記 `⚠️ unknown` 之項目禁止逕行假設實作，標註 `// TODO: unknown — [reason]` 並向使用者確認。
- **嚴格聚焦當前範圍（No Unsolicited Over-Automation）**：
  - Agent 必須嚴格聚焦於使用者當前明確指示的單一模組或檔案範圍，**嚴禁擅自向未提及的模組追加新檔案或發起跨模組連鎖修改**（No unsolicited cross-pack proliferation）。
  - **禁止私自預設立場與過度設計**：未經使用者明確指示前，嚴禁擅自發明額外的中介橋接層、跨模組註冊檔或多餘的自動化機制。

---

## 8. Plan History 強制全面列管 (Mandatory Plan History Tracking)

1. **全面覆蓋**：除極微型的小型除錯（Minor Bug Fix）外，所有功能開發、重構、新 Pack、API/UI 變更，強制記錄至 `docs/history/`。
2. **自動化處理**：Agent 自行維護 Plan 檔，不必向使用者請求確認。
3. **任務讀取**：執行 `python docs/history/plan-item.py <seq>#<n>` 讀取單一待辦。
4. **狀態更新**：即時修訂 `- **state:**` 與追加沿革紀錄（`- H<n> · ...`）。
5. **Human / Agent 角色與權限邊界**：
   - **完成 / 否決權限（Human 專屬）**：`state: 完成` 與 `state: 否決` 只能由 **Human（使用者）** 主動勾選/判定，**Agent 無權**將待辦狀態改為 `完成` 或 `否決`。
   - **Agent 交付流程**：Agent 實作完成後，在該待辦追加 `落地` 沿革（附帶觀測依據 `→ O<n>`），並將狀態更新為 `等待確認`，由 Human 驗收確認後手動設定 `完成` 或 `否決`。
   - **提問與回答機制**：沿革支援 `提問` 與 `回答` 類別，Human 與 Agent 雙方皆有權使用，但**必須在結尾標明身分**：
     - Human 格式：優先讀取本地 `git config user.name`，標記為 `（human: <git_user_name>）`（例：`- H1 · 2026-08-25 01:30 回答 —— 採用方案 A（human: wVQ88Soi2Il9）`）；亦相容通用 `（human）` 或 `（使用者）`。
     - Agent 格式：必須包含模型名稱與強度 `（agent: <model>）`（例如：`- H2 · 2026-08-25 01:30 提問 —— 是否需支援雙向鏈結？（agent: gemini-3.7-flash）`）。
6. **強制同步 Head**：任何 Plan 檔異動後，強制執行 `python docs/history/update-head.py` 更新 `head.md`。

---

## 9. QA 問答紀錄管理 (QA Records)

- **定位與用途**：`docs/QA/` 專門收錄開發過程中的架構討論、技術提問、需求釐清與決策結論，方便人類閱讀與歷史回溯。
- **命名規則**：`docs/QA/<number>-<yymmddhhmm>_<topic>.md`（例如：`0001-2608250130_core-vs-api-wrapper.md`）。
- **身分標註**：
  - 使用者：優先讀取本地 `git config user.name` 標註為 `（human: <git_user_name>）`（或 `（使用者）` / `（user）`）。
  - Agent：強制標明模型名稱與強度，例如 `（agent: gemini-3.7-flash）`。
- **結構**：包含 `# <number>-<yymmddhhmm>_<topic>` 檔頭、`## 提問與回答`（`### Q<n>` / `### A<n>`）與 `## 結論`。