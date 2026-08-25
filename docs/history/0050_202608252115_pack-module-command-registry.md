# 0050_202608252115_pack-module-command-registry

- **status:** in-progress
- **prev:** ./0049_202608250332_unified-pack-module-index-architecture.md
- **skill:** plan-history v3

## 主題簡述

將可逆地圖指令（`map_command`）正式納入 `pack_module` 模組註冊契約與全域 Registry 體系：
1. **Core 指令工廠型別**：在 `src/core/types.ts` 定義 `map_command_factory`，並擴充 `pack_module` 介面之 `commands?: Record<string, map_command_factory>` 欄位。
2. **Vanilla 指令查詢 API**：在 `src/packs/vanilla/registry_query.ts` 增加 `has_command` 與 `get_command`（Fail-Fast），提供跨模組之統一查詢與比對能力。
3. **Core 核心指令註冊**：將 `core` 旗下可逆指令（`create_device`, `delete_device`, `move_device`, `select_recipe`）標準化封裝並註冊至全域 Registry。
4. **Pack 擴充與 CLI 動態分派**：使 `layered_2d`、`pipe` 等 Pack 能夠自行聲明專屬指令（如 `rotate_device`, `flip_device`），為 CLI 動態字串比對與自動化執行奠定基礎。

## 觀察與推論

### O1 · 2026-08-25 21:15:00+08:00 — 完善 Pack Module 之指令註冊閉環
現有 `pack_module` 已包含 `items`、`recipes`、`devices`，但缺少 `commands` 註冊表。補齊 `commands?: Record<string, map_command_factory>` 與 Vanilla `get_command` / `has_command` 能使地圖異動操作與 CLI 完全資料驅動，消除硬編碼 switch-case 與跨 Pack 擴充障礙。

## 待辦

### 1 擴充 Core 型別與 pack_module 指令契約 (Core Command Types)
- **state:** 等待確認
- **basis:** → O1

在 `src/core/types.ts` 定義 `map_command_factory`，並於 `pack_module` 擴充 `commands?: Record<string, map_command_factory>`，於 `src/core/index.ts` 公開導出。

**沿革**

- H1 · 2026-08-25 21:15 決斷 —— 新增 Pack Module 指令註冊表計畫（使用者）
- H2 · 2026-08-25 21:17 落地 —— 於 types.ts 宣告 map_command_factory 並於 pack_module 新增 commands 欄位（agent: gemini-3.7-flash-high） → O1

### 2 在 Vanilla 提供指令查詢與驗證 API (Vanilla Command Query API)
- **state:** 等待確認
- **basis:** → O1

在 `src/packs/vanilla/registry_query.ts` 新增 `has_command` 與 `get_command`（採 Fail-Fast 原則，查無指令時拋出明確例外），並於 `src/packs/vanilla/index.ts` 公開導出。

**沿革**

- H1 · 2026-08-25 21:15 決斷 —— 新增 Vanilla 指令查詢 API 待辦（使用者）
- H2 · 2026-08-25 21:17 落地 —— 於 registry_query.ts 實作 has_command 與 get_command 並經單元測試驗證通過（agent: gemini-3.7-flash-high） → O1

### 3 註冊 Core 核心地圖可逆指令至 Registry (Core Commands Registration)
- **state:** 等待確認
- **basis:** → O1

在 `src/core/commands.ts` 匯出 `core_commands` 字典物件，並在 `src/packs/loader.ts` / 模組加載期將 `core` 模組及其指令群註冊進全域 Registry。

**沿革**

- H1 · 2026-08-25 21:15 決斷 —— 新增 Core 指令標準註冊待辦（使用者）
- H2 · 2026-08-25 21:17 落地 —— 於 commands.ts 匯出 core_commands，並於 loader.ts 加載時註冊 core 核心模組（agent: gemini-3.7-flash-high） → O1

### 4 擴充 Pack 指令註冊與 CLI / UI 整合 (Downstream Integration)
- **state:** 待實作
- **basis:** → O1

將 `layered_2d` 的 `rotate_device`、`flip_device` 等指令註冊至其 `pack_module.commands`，並更新 CLI 執行器支援動態查找。

**沿革**

- H1 · 2026-08-25 21:15 決斷 —— 新增下游 Pack 指令註冊與 CLI 整合待辦（使用者）
