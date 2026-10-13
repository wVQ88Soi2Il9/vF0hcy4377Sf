# 0012_202608190209_rename-unique-id-to-uid

- **status:** done
- **prev:** 0011_202608190200_recipe-machine-decouple.md
- **skill:** plan-history v3

## 主題簡述

統一將全專案核心型別（`device`, `game_map`, `device_node`）、地圖管理員、渲染器、UI 與演算法中的 `unique_id` 命名重構為 `uid`。

## 觀察與推論

### O1 · 2026-08-19 02:09:00+08:00 — 命名簡化與統一
`uid` 比 `unique_id` 更加簡潔一致，能更好地對齊 CMD 語法（如 `--"<uid>"`）、文件規範與 UI 面板呈現。

## 待辦

### 1 統一 unique_id 為 uid
- **state:** 完成
- **basis:** → O1

重構 `types.ts`（`device.uid`, `game_map.uid`, `device_node.uid`）、`map_manager.ts`、`basic_ui`、`$basic_renderer`、`vanilla` 與文件中的 `unique_id` 欄位與變數名稱為 `uid`。

**沿革**
- H1 · 2026-08-19 02:09 決斷 —— 確定統一命名 unique_id 為 uid → O1
- H2 · 2026-08-19 02:12 落地 —— 完成全專案 unique_id 改為 uid 重構 → O1
