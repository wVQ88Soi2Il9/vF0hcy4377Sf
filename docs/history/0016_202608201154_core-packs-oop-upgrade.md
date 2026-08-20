# 0016_202608201154_core-packs-oop-upgrade

- **status:** done
- **prev:** 0015_202608201147_allow-bold-oop.md
- **skill:** plan-history v3

## 主題簡述

將 Core 與 Other Packs 的裝置（Device）、地圖（Map）與註冊表（Registry）架構全面升級為原生物件導向（OOP）類別體系，封裝實例方法並維持向後相容。

## 觀察與推論

### O1 · 2026-08-20 11:54:00+08:00 — 核心與周邊模組 OOP 一致性
將 Core 的 `device`、`device_definition`、`game_map` 與 `pack_registry` 升級為原生 OOP 類別（`device_instance`、`device_definition_base`、`game_map_instance`、`pack_registry_instance`），使 Packs（如 `ef_device`）能直接繼承核心類別，大幅提高架構內聚力與擴充彈性。

## 待辦

### 1 實作 Core 與 Packs OOP 類別升級
- **state:** 完成
- **basis:** → O1

完成 `device_instance`、`device_definition_base`、`game_map_instance`、`pack_registry_instance` 之 OOP 實作，並讓 `ef_device` 直接繼承 `device_definition_base`，對接 API 與周邊 packs。

**沿革**
- H1 · 2026-08-20 11:54 決斷 —— 確立 Core 與 Packs 全面 OOP 類別升級方案 → O1
- H2 · 2026-08-20 11:57 落地 —— 完成 Core 類別升級、API 導出與 ef_device 繼承重構 → O1
