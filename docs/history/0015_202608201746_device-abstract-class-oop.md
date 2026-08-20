# 0015_202608201746_device-abstract-class-oop

- **status:** in-progress
- **prev:** `./0014_202608200251_variable-shape-device.md`
- **skill:** plan-history v3

## 主題簡述

將核心實體 `device` 從純靜態資料結構（Data Structure + JSON 靜態藍圖）重構為抽象類別（Abstract Class / OOP 多型架構），並全面重構 Core、Utils、API、Packs（Loader, Vanilla, Renderer, UI）及 Test 模組的呼叫與定義方式。

**本計畫的約束**

- 遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 嚴格維持 Packs → Utils → Core 三層單向依賴架構，Packs 僅透過 `@/API` 與 Core 互動。
- 拒絕隱性補齊，向量與座標運算維持乾淨完整資料假設。

## 規劃描述

1. **Core 型別與抽象類別定義**：完善 `src/core/types.ts` 中的 `device` 抽象類別（包含 `rotation` 屬性、`get_shape()`、`get_input_ports()`、`get_output_ports()` 抽象方法），更新 `pack` 介面並清理已廢棄的 `device_definition`。
2. **實例化與註冊機制**：重構 `src/core/pack_manager.ts` 支援 Device Class 註冊（`device_classes`），修訂 `src/core/map_manager.ts` 與 `src/API.ts` 之 `create_device` 透過工廠或類別建構子實例化。
3. **動態計算與載入器重構**：簡化 `src/utils/device_utils.ts` 為多型呼叫，更新 `src/packs/loader.ts` 支援 `packs/*/devices/*.ts` 類別動態載入，重構 `src/packs/vanilla/overlap.ts` 與 `graph.ts`。
4. **渲染與 UI 模組適配**：調整 `src/packs/basic_renderer/draw_registry.ts` 與 `draw_device.ts` 移除 `def` 依賴；更新 `src/packs/basic_ui/info_bar.ts` 與 `cmd_executor.ts`。
5. **Test Pack 類別化與繪圖模組更新**：將 `packs/test/data/devices.json` 轉為具體 Device 子類別實作，更新 `$basic_renderer/*.ts` 繪圖函式。
6. **專案規範與文檔同步**：更新 `docs/conventions.md`（Rule 2）與 `docs/architecture.md`。

## 觀察與推論

### O1 · 2026-08-20 17:42:00+08:00 — Device 轉型為 Abstract Class 之架構影響
在 `dev/oop` 分支上，`src/core/types.ts` 將 `device` 改為 `abstract class` 並移除了 `device_definition`。這使得原先依賴「`device_definition`（靜態定義）+ `device`（實體資料）」之外部函式（如 `get_world_cells(dev, def)`、`get_world_ports(dev, def)`、`overlap` 檢查、`graph` 建構、`draw_devices`）均需要轉型為呼叫 `device` 的多型方法。

### O2 · 2026-08-20 17:45:00+08:00 — 全域相應重構模組盤點
盤點出需同步重構的 5 大層級：
1. `core/`：`types.ts`（補回 `rotation`、定義抽象方法 `get_shape` / `get_ports`、確認 `definition_id`）、`map_manager.ts`（`create_device` 透過工廠/類別實例化）、`pack_manager.ts`（`device_classes` 註冊表）。
2. `utils/`：`device_utils.ts`（`get_world_cells` / `get_world_ports` 簡化為呼叫 `dev` 方法）。
3. `API.ts`：更新型別導出與註冊/建立函式。
4. `packs/`：`loader.ts` 支援 TypeScript 類別動態載入、`vanilla`（`overlap.ts`, `graph.ts`）、`basic_renderer`（`draw_registry.ts`, `draw_device.ts`）、`basic_ui`（`info_bar.ts`, `cmd_executor.ts`）、`test`（具體 device 子類別實作與 `$basic_renderer` 繪圖函式更新）。
5. `docs/`：`conventions.md`（Rule 2 支援 TS 類別宣告）與 `architecture.md` 文檔同步。

## 待辦

### 1 重構 Core 層型別與抽象類別定義
- **state:** 完成
- **basis:** → O1、O2
- **承接:** 0014#1

移除 `core/types.ts` 中的 `rotation` 相關型別（`rotation_plane`、`rotation`），在 `device` 抽象類別中加入 `get_shape(): vector[]` 與 `get_port(type: 'input' | 'output'): vector[]` 抽象方法，並清理 `pack` 介面中的 `device_definition`。

**沿革**

- H1 · 2026-08-20 17:46 決斷 —— 確立 device abstract class 成員與多型抽象方法設計，承接 0014#1（使用者）
- H2 · 2026-08-20 17:56 決斷 —— 移除 rotation 相關型別，並於 abstract class device 加入 get_shape 與 get_port 抽象方法（使用者）
- H3 · 2026-08-20 17:56 落地 —— 更新 src/core/types.ts 完成抽象類別與型別修訂（使用者）

### 2 重構 Core 與 API 實例化與註冊機制
- **state:** 完成
- **basis:** → O2
- **承接:** 0014#2

重構 `src/core/pack_manager.ts` 加入 `device_constructor` 型別與 `device_classes` 註冊表（`register_device_class`、`get_device_class`），更新 `src/core/map_manager.ts` 之 `create_device` 透過類別建構子實例化並移除 `rotate_device`，於 `src/core/hooks.ts` 與 `src/API.ts` 同步更新匯出。

**沿革**

- H1 · 2026-08-20 17:46 決斷 —— 確立 Device Class 註冊與實例化機制，承接 0014#2（使用者）
- H2 · 2026-08-20 17:59 落地 —— 完成 hooks, pack_manager, map_manager, API 之類別註冊與實例化機制重構（使用者）

### 3 重構 Utils 與 Packs 動態計算與載入器
- **state:** 待決斷
- **basis:** → O1、O2
- **承接:** 0014#3、0014#4

簡化 `src/utils/device_utils.ts` 為多型呼叫；更新 `src/packs/loader.ts` 支援 `packs/*/devices/*.ts` 類別動態載入；重構 `src/packs/vanilla/overlap.ts` 與 `graph.ts` 直接透過 `dev` 多型方法取得佔用格與埠口。

**沿革**

- H1 · 2026-08-20 17:46 決斷 —— 確立 Utils 與 Vanilla Packs 多型化及 Loader 類別掃描，承接 0014#3 與 0014#4（使用者）

### 4 重構 Basic Renderer 與 Basic UI 模組
- **state:** 待決斷
- **basis:** → O2

調整 `src/packs/basic_renderer/draw_registry.ts` 與 `draw_device.ts` 移除 `def: device_definition` 參數，改從 `device` 實例取得幾何資訊；更新 `src/packs/basic_ui/info_bar.ts` 與 `cmd_executor.ts`。

**沿革**

- H1 · 2026-08-20 17:46 決斷 —— 確立 Renderer 與 UI 模組移除 def 依賴並適配 OOP 實例（使用者）

### 5 重構 Test Pack 具體裝置類別與繪圖模組
- **state:** 待決斷
- **basis:** → O2

將 `packs/test/data/devices.json` 內的裝置定義轉換為具體 Device 子類別實作，並更新 `packs/test/$basic_renderer/*.ts` 繪圖函式以適配新架構。

**沿革**

- H1 · 2026-08-20 17:46 決斷 —— 確立 Test Pack 裝置轉型為 TypeScript 類別與繪圖模組適配（使用者）

### 6 同步更新專案規範與架構文檔
- **state:** 完成
- **basis:** → O2
- **承接:** 0014#5

將「實驗性分支免受既有規則拘束 (Experimental Branch Exemption)」原則加入 `AGENTS.md` 與 `docs/conventions.md`，明確規定在實驗性分支（如 `dev/oop`）進行探索時，既有規範與文檔約束不適用，允許自由驗證全新架構。

**沿革**

- H1 · 2026-08-20 17:46 決斷 —— 確立修訂 conventions 與 architecture 文檔，承接 0014#5（使用者）
- H2 · 2026-08-20 17:47 否決 —— 實驗性分支（dev/oop）不適用既有規則約束，暫不更新規範文檔（使用者）
- H3 · 2026-08-20 17:49 落地 —— 將實驗性分支免受規則拘束原則寫入 AGENTS.md 與 docs/conventions.md（使用者）
