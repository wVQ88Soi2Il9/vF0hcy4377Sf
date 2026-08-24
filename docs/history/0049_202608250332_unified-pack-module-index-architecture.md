# 0049_202608250332_unified-pack-module-index-architecture

- **status:** in-progress
- **prev:** ./0048_202608241716_history-human-agent-roles-and-qa.md
- **skill:** plan-history v3

## 主題簡述

將 Pack 架構全面收斂為「**Pack 即命名空間物件（Pack-as-a-Module-Object）**」：
1. **上層 SSOT（單一真實來源）**：各 Pack 的 `index.ts` 統一作為該模組的唯一對外實體，封裝並匯出其旗下的所有 items、recipes、devices 建構子與模組函式。
2. **底層極致精簡**：Core Registry 簡化為單一 `Map<string, pack_module>`，徹底移除底層分散的 items/recipes/devices 多重註冊表。
3. **雙向相容查詢**：提供標準輔助函式，支援 TypeScript 物件點語法（`pipe.devices.straight`）、`namespaced_id` 物件（`{ pack: 'pipe', id: 'straight' }`）與字串（`"pipe:straight"`）無縫互通。

## 觀察與推論

### O1 · 2026-08-25 03:32:00+08:00 — 模組物件即命名空間之架構收斂
將 Pack 視為獨立完整的物件（包含 items, recipes, devices, 工具函式），可大幅簡化 Core 底層 Registry 結構（從多個分散 Map 簡化為單一 Pack 模組 Map），並提供極佳的 TypeScript 靜態型別自動補全與安全重構體驗。

### O2 · 2026-08-25 04:25:00+08:00 — Core 層極致純粹與全面 namespaced_id 契約
Core 註冊表、map_command、item_definition、recipe、device 全面採 namespaced_id 純物件識別子，所有字串轉換統一移至 src/utils/identifier.ts；查詢函式（get_item, get_recipe, get_device_class）採 Fail-Fast 嚴格拋錯，不帶 | undefined；提供專用 has_* 函式進行探索性判斷。

## 待辦

### 1 Core 型別與 Registry 重構（Core Types & Unified Registry）
- **state:** 等待確認
- **basis:** → O1, O2

在 `src/core/types.ts` 與 `src/core/pack_manager.ts` 定義 `pack_module` 契約（包含 `id: string`、可選的 `items`、`recipes`、`devices`、`init_pack?`），並將 `pack_registry` 簡化為單一 `packs: Map<string, pack_module>` 容器，提供核心統一查表函式。

**沿革**

- H1 · 2026-08-25 03:32 決斷 —— 確立統一 Pack 模組物件與底層精簡方案（human: wVQ88Soi2Il9）
- H2 · 2026-08-25 04:28 落地 —— 全面完成 Core 型別（map_command, item_definition, recipe, device）與註冊表之 namespaced_id 重構，字串轉換收斂至 utils/identifier，查詢採嚴格 Fail-Fast 且無 undefined（agent: gemini-3.7-flash） → O2

### 2 Pack Index 統一模組化封裝（Packs Index Harmonization）
- **state:** 待實作
- **basis:** → O1

重構現有各 Pack（`vanilla`, `basic_ui`, `layered_2d`, `pipe`, `ef`, `shirones_ui`, `cuboid_device`）的 `index.ts`，統一以符合 `pack_module` 規範的命名物件匯出其 items、recipes、devices 與工具函式。

**沿革**

- H1 · 2026-08-25 03:32 決斷 —— 承接各 Pack index 統一封裝任務（human: wVQ88Soi2Il9）

### 3 Loader 自動載入器簡化（Loader Streamlining）
- **state:** 待實作
- **basis:** → O1

簡化 `src/packs/loader.ts`，由 Loader 統一掃描並載入各 Pack 的 `index.ts` 註冊至全域 Registry，並執行 `init_pack()`；支援純 JSON 資料的合成包裝。

**沿革**

- H1 · 2026-08-25 03:32 決斷 —— 承接 Loader 簡化任務（human: wVQ88Soi2Il9）

### 4 下游 UI / CLI 對齊與功能整合驗證（UI / CLI Alignment & Verification）
- **state:** 待實作
- **basis:** → O1

更新 Shirones UI（Device Creator, Device Card, Recipe Selector）、CLI 指令與測試腳本，驗證在新架構下所有裝置建立、配方選擇、分支合併與畫布渲染運作正常。

**沿革**

- H1 · 2026-08-25 03:32 決斷 —— 承接 UI/CLI 對齊與驗證任務（human: wVQ88Soi2Il9）
