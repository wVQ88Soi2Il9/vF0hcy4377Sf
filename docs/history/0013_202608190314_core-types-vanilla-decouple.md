# 0013_202608190314_core-types-vanilla-decouple

- **status:** done
- **prev:** 0012_202608190209_rename-unique-id-to-uid.md
- **skill:** plan-history v3

## 主題簡述

清理核心型別（移除 `power_stack`），並將 Vanilla Pack 專用型別（`map_validation_result`、`device_node`）移至 `packs/vanilla` 達成 Core 完全解耦，同時於 `AGENTS.md` 加入 Git 自動化執行規範。

## 觀察與推論

### O1 · 2026-08-19 03:13:00+08:00 — Core 核心型別輕量化與 Vanilla 邏輯解耦
`power_stack` 屬於特定系統之資料結構，且 `map_validation_result` 與 `device_node` 為 Vanilla Pack 之演算法與檢查結果型別。Core 應維持零具體遊戲邏輯與嚴格三層單向架構，不應持有 Pack 專用型別。

### O2 · 2026-08-19 03:15:00+08:00 — Git 操作自動化效率提升
使用者下達 Git 操作指示時，Agent 應自動完成 add、產生 commit message 並直接 commit，減少來回確認以提升協作流暢度。

## 待辦

### 1 移除 power_stack 與解耦 Vanilla 專用型別
- **state:** 完成
- **basis:** → O1

從 `core/types.ts` 移除 `power_stack` 與 `recipe.power`；將 `map_validation_result` 與 `device_node` 遷移至 `packs/vanilla/types.ts`，並更新 `core/hooks.ts` 與 Vanilla 模組。

**沿革**
- H1 · 2026-08-19 03:13 決斷 —— 確定移除 power_stack 並將 map_validation_result, device_node 移至 packs/vanilla → O1
- H2 · 2026-08-19 03:14 落地 —— 完成 types 遷移、hooks 解耦與 packs/vanilla 重構 → O1

### 2 於 AGENTS.md 確立 Git 指令自動執行規範
- **state:** 完成
- **basis:** → O2

在 `AGENTS.md` 中新增「Git 指令自動執行」規範，明確指出收到 Git 指令時自動完成 add、訊息生成與 commit。

**沿革**
- H1 · 2026-08-19 03:15 決斷 —— 確立 Git 相關指令自動執行無需額外二次確認 → O2
- H2 · 2026-08-19 03:15 落地 —— 更新 AGENTS.md 核心原則 → O2
