---
description: Project conventions, architecture design, and coding guidelines
trigger: always_on
---

# Project Guidelines & Architecture

本文件為專案唯一的架構與開發規範（Single Source of Truth），所有開發與程式碼均須嚴格遵守。

---

## 1. 系統架構與邊界隔離 (Three-Layer Architecture)

依賴關係嚴格單向：`packs` → `utils` → `core`。

- **Core Layer**（`src/core/`）：純型別、狀態容器、Hooks 系統、Undo Tree 歷程。零業務邏輯、零外部依賴。
- **Utils Layer**（`src/utils/`）：無副作用純數學運算、幾何座標驗證、空間雜湊查表。
- **Packs Layer**（`src/packs/`）：所有具體遊戲規則、渲染器、UI 介面、CLI 與資料包。
- **邊界隔離**：Pack 嚴禁直接引用 `@/core/*`，一律經由 `@/API` 與 `@/utils/*` 存取。禁止直接操作 `hooks` 物件，必須透過 `@/API` 函式訂閱。

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

- **嚴格語法**：參數強制為 `--"<arg>"` 格式；軸向為 `d<n>`；無指令別名；不符格式直接拋錯。
- **標準指令集**：`create`, `move`, `delete`, `info`, `camera`, `undo`, `redo`, `jump`, `prev-fork`, `next-fork`, `history`, `help`。

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

---

## 8. Plan History 強制全面列管 (Mandatory Plan History Tracking)

1. **全面覆蓋**：除極微型的小型除錯（Minor Bug Fix）外，所有功能開發、重構、新 Pack、API/UI 變更，強制記錄至 `docs/history/`。
2. **自動化處理**：Agent 自行維護 Plan 檔，不必向使用者請求確認。
3. **任務讀取**：執行 `python docs/history/plan-item.py <seq>#<n>` 讀取單一待辦。
4. **狀態更新**：即時修訂 `- **state:**` 與追加沿革紀錄（`- H<n> · ...`）。
5. **強制同步 Head**：任何 Plan 檔異動後，強制執行 `python docs/history/update-head.py` 更新 `head.md`。