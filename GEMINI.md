---
description: Project conventions, architecture design, and coding guidelines
trigger: always_on
---

# Project Guidelines & Architecture

本文件為專案唯一的架構與開發規範，所有開發與程式碼均須嚴格遵守。

---

## 1. Agent 協作最高紅線 (Agent Behavioral Prohibitions - 協作中一定不要做的事)

本專案最高優先級約束，規範 Agent 與使用者協作時的行為邊界：

1. **預料外大改立即熔斷 (Halt on Unexpected Major Refactor)**：
   - 執行過程中一旦發現涉及未預期、大幅度超出當前待辦範疇之破壞性修改或連鎖重構，**必須立即停止作業，主動向使用者說明情況並確認意圖**，嚴禁逕行推演實作。
2. **嚴格聚焦當前範圍，禁止擅自擴散 (Strict Scope & No Over-Automation)**：
   - Agent 必須嚴格聚焦於使用者當前明確指示的單一模組或檔案範圍，**嚴禁擅自向未提及的模組追加新檔案或發起跨模組連鎖修改**（No unsolicited cross-pack proliferation）。
   - **禁止私自預設立場與過度設計**：未經使用者明確指示前，嚴禁擅自發明額外的中介橋接層、跨模組註冊檔或多餘的自動化機制。
3. **重命名作業 Human 優先，禁止大範圍文字取代 (Human-First Rename & Refactoring)**：
   - 涉及跨檔案之符號、型別、變數、函式或檔案重命名（Rename Refactor），**優先交由 Human（使用者透過 IDE 語意重構工具）統一處理**，以確保修改之迅速、精準與安全性，Agent 嚴禁主動發起大範圍文字取代。
4. **禁止 Agent 擅自判定待辦「完成」或「否決」 (Human-Exclusive States)**：
   - `state: 完成` 與 `state: 否決` 專屬 **Human（使用者）** 判定與勾選，**Agent 無權**將待辦狀態改為完成或否決。Agent 實作完成後一律只能更新為 `等待確認`。
5. **禁止逕行實作未決項目 (Unknown Policy)**：
   - 標記 `⚠️ unknown` 之項目禁止逕行假設實作，標註 `// TODO: unknown — [reason]` 並向使用者確認。
6. **以當前需求與已確認的設計為準，不要為假設的歷史包袱、安全性或相容性增加程式碼。**
   - 不預設需要相容舊 API、舊資料或已棄用的設計。
   - 不為「下游可能誤用」擅自加入防禦性檢查、fallback。
   - 新增這些機制時，必須能指出目前實際存在的需求或具體風險；「比較安全」「以後可能需要」不足以構成理由。
   
---

## 2. Plan History 核心溝通與任務列管 (Plan History Collaboration Protocol)

`docs/history/` 為 Human 與 Agent 任務對齊、歷程追蹤與決策溝通的**唯一核心媒介**：

1. **全面覆蓋**：除極微型除錯外，所有功能開發、重構、新 Pack、API/UI 變更，強制記錄至 `docs/history/`。
2. **自動化維護**：Agent 自行維護 Plan 檔，不必向使用者請求確認。
3. **任務讀取**：執行 `python docs/history/plan-item.py <seq>#<n>` 讀取單一待辦。
4. **狀態即時更新**：即時修訂 `- **state:**` 與追加沿革紀錄（`- H<n> · ...`）。
5. **Agent 交付流程**：
   - 實作完成後，在該待辦追加 `落地` 沿革（附帶觀測依據 `→ O<n>`）。
   - 將狀態更新為 `等待確認`，由 Human 驗收後判定 `完成` 或 `否決`。
6. **對話與提問身分標註**：
   - 沿革支援 `提問` 與 `回答`，雙方皆有權使用，但結尾必須標明身分：
     - Human：優先讀取本地 `git config user.name` 標記為 `（human: <git_user_name>）`（或 `（human）` / `（使用者）`）。
     - Agent：強制包含模型名稱與強度 `（agent: <model>）`（例：`（agent: gemini-3.7-flash-high）`）。
7. **強制同步 Head**：任何 Plan 檔異動後，強制執行 `python docs/history/update-head.py` 更新 `head.md`。

---

## 3. 決策、雙向論證與 QA 紀錄 (Decision, Advocacy & QA Records)

1. **意見徵詢與決策雙向論證 (Balanced Advocacy: Why We Should + Why We Shouldn't)**：
   - 當使用者詢問意見、架構決策、技術選型或重構方向時，Agent **必須同時且對等地提供「贊同／採納的理由（Why we should）」與「反對／保留／潛在代價的理由（Why we shouldn't）」**，嚴禁單向盲從附和或片面論述，以確保決策評估之全面性與客觀性。
2. **過渡相容設施 TODO 列管與強制清理 (Transitional Code Tagging & Mandatory Cleanup)**：
   - 為了平滑重構所暫時保留之過渡相容別名、橋接轉發檔或相容包裝，**一律強制於程式碼標註 `// TODO: transitional - [cleanup target]` 並在 Plan 中列管清理待辦**，重構遷移完成後必須徹底移除，嚴禁永久殘留為技術債。
3. **QA 問答紀錄管理 (QA Records)**：
   - **定位與用途**：`docs/QA/` 專門收錄開發過程中的架構討論、技術提問、需求釐清與決策結論。
   - **命名規則**：`docs/QA/<number>-<yymmddhhmm>_<topic>.md`。
   - **身分標註**：Human 標記 `（human: <git_user_name>）`；Agent 標記 `（agent: <model>）`。
   - **結構**：包含 `# <number>-<yymmddhhmm>_<topic>` 檔頭、`## 提問與回答` 與 `## 結論`。

---

## 4. 程式碼風格與語法規範 (Code Conventions - 程式碼約束)

- **Allman 大括號**：大括號 `{` 一律強制換行。
- **全小寫 `snake_case`**：變數、函式、型別、檔案、JSON key 一律全小寫底線命名。
- **分號結尾**：所有陳述句結尾強制加上半形分號 `;`。
- **拒絕隱性補齊 (No Implicit Zero-Padding)**：嚴禁使用 `?? 0` 修補缺漏維度，向量長度須嚴格符合運算維度。
- **空間 UID**：`space.uid` 從 `1` 開始遞增分配。

---

## 5. 系統架構與領域規範 (System Architecture & Domain Specifications)

### 5.1 系統架構與邊界隔離
- **依賴單向性**：`packs` → `core`（空間幾何與通用工具收斂於 `@/packs/vanilla`，世界容器收斂於 `@/world`）。
- **Core Layer（`src/core/`）**：定義「何謂世界（What is a world）」——包含純契約型別、裝置基類（`abstract class device`）、空間實體（`class space`）、世界聚合實體（`class world = space + history + registry`）、Hooks 系統與 Undo Tree 純演算法。零業務邏輯、零全域活體狀態。唯一公開進入點為 `src/core/index.ts`。
- **World Layer（`src/world.ts`）**：管理「當前世界實例（Current worlds, may > 1）」——多世界實例倉庫（`_worlds: Map`）、Active World 焦點指標切換與快捷分派代理。
- **Packs Layer（`src/packs/`）**：所有具體遊戲規則、渲染器、UI 介面、CLI 與資料包。每個 Pack 的唯一公開進入點為其 `index.ts`。
- **CLI 與 UI 邊界**：
  - `cli_tool` 純粹化：純文字解析與 Core Registry 指令分派，嚴禁嵌入業務邏輯或要求專屬橋接檔。
  - `shirones_ui` 職責：僅負責面板渲染、DOM 事件處理與別名映射。
- **邊界隔離與 Import 規範 (Public Entrypoint Rule)**：
  - **禁止深層引用**：跨模組引用時，**必須一律從目標模組的 `index.ts` 公開進入點 import**（例：`@/core`、`@/packs/<pack>`），嚴禁直接依賴目標內部檔案（例：禁止 `import ... from '@/core/commands'`）。
  - **Hooks 保護**：外部禁止直接操作 `hooks` 物件，必須透過 `@/core` 導出的訂閱函式。

### 5.2 2× 網格與端口座標系統 (2× Grid & Face Ports)
- **裝置錨點 (`position`)**：全為偶數座標 $(2i, 2j, 2k, \dots)$，代表網格最小頂點。
- **單元佔據空間**：每個單元格佔據 $[x, x+2) \times [y, y+2) \times [z, z+2)$ 區間。
- **邊界端口 (`port`)**：落於單元格交界面中心，座標必為恰 1 軸偶數、其餘 $n-1$ 軸奇數。
- **校驗工具**：使用 `is_valid_device_position` 與 `is_valid_port_position` 驗證。

### 5.3 物件導向與能力介面 (OOP & Capability Interfaces)
- **垂直繼承（Is-A）**：`abstract class device`（`assembler extends base_device extends device`）。
- **水平能力（Can-Do）**：`implements` 組合能力契約（`drawable_device`, `rotatable_device`）。
- **繪圖內聚**：裝置類別實作 `draw()` 方法，渲染器直接多型呼叫。

### 5.4 Pack 模組與自動載入
- **目錄結構**：`data/items.json`、`recipes/*.ts`、`devices/*.ts`、`index.ts`、`$<rely_pack>/`。
- **自動掃描**：`src/packs/loader.ts` 自動載入並呼叫 `init_pack()`。
- **物件導出**：對外介面統一封裝為命名物件（例：`export const basic_renderer = { ... }`）。

### 5.5 分支歷史樹 (Undo Tree)
- **可逆指令**：所有空間異動封裝為具備 `execute(space)` 與 `inverse(space)` 的 `space_command`。
- **非線性分支**：Undo 後執行新操作自動開闢新分支。
- **節點跳轉**：`jump_to_history` 透過 LCA 最短路徑重放轉換狀態。

### 5.6 CLI 命令列規範
- **嚴格語法**：空格分隔位置參數（`cmd <arg1> <arg2> ...`）、連續數字座標向量（`create_device conveyor 4 4 0`）、相機切片 `d<n>=<val>`。
- **別名原則**：由各 Pack 自行提供；Core 與 History 導航不提供別名。

---

## 6. 輔助操作與工具指令 (Auxiliary Operations - Git 與編譯檢查)

1. **Git 提交流程**：收到 Git 指令指示時，自動完成 `git add`、生成語意化 commit message 並執行 `git commit`。
2. **編譯檢查便利原則**：除非使用者明確指示，Agent 不主動執行 `npx tsc -b`。