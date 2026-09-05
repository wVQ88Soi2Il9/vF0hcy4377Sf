# 0059_202609060253_vanilla-alpha-operations-fail-fast-and-namespace

- **status:** in-progress
- **prev:** ./0058_202609060241_core-reversible-operation-refactor.md
- **skill:** plan-history v3

## 主題簡述

改進 `src/packs/vanilla_alpha/operations.ts`：將 metadata 自 `other_info.core` 遷移至 `other_info.vanilla_alpha` 實現命名空間標準化；並在 `delete`、`move`、`select_recipe` 實作 Fail-Fast 查核，裝置不存在時拋出明確例外。

---

## 觀察與推論

### O1 · 2026-09-06 02:52:00+08:00 — 確立 metadata 命名空間標準化與 Fail-Fast 錯誤處理
依據使用者指示處理項目 5 與 3：
1. 項目 5：`operations.ts` 內的操作屬 `vanilla_alpha` Pack，但過去 metadata 存放於 `other_info.core`，存在命名空間歸屬矛盾。全面更正為 `other_info.vanilla_alpha`。
2. 項目 3：過去在 `delete`、`move`、`select_recipe` 遇到找不到裝置時採取靜默忽略，易隱蔽狀態脫節與無效呼叫。改為全面採取 Fail-Fast 拋出例外。

---

## 待辦

### 1 標準化 operations 的 other_info 命名空間為 vanilla_alpha (Namespace other_info to vanilla_alpha)
- **state:** 等待確認
- **basis:** → O1

在 `src/packs/vanilla_alpha/operations.ts` 將 `create_device_operation`、`delete_device_operation`、`move_device_operation` 與 `select_recipe_operation` 中的 `other_info.core` 改為 `other_info.vanilla_alpha`。

**沿革**

- H1 · 2026-09-06 02:52 決斷 —— 確立 other_info 命名空間回歸 vanilla_alpha（human: wVQ88Soi2Il9）
- H2 · 2026-09-06 02:53 落地 —— 完成 operations.ts 4 個操作之 other_info 鍵值改為 vanilla_alpha（agent: gemini-3.8-flash-high） → O1

### 2 在 delete/move/select_recipe 加入 Fail-Fast 檢查 (Fail-Fast Verification on Missing Devices)
- **state:** 等待確認
- **basis:** → O1

在 `delete_device_operation`、`move_device_operation` 與 `select_recipe_operation` 的 `execute` 與 `inverse` 中，當目標裝置不存在於 `sp.devices` 時拋出例外。

**沿革**

- H1 · 2026-09-06 02:52 決斷 —— 確立操作在裝置缺失時執行 Fail-Fast 拋錯（human: wVQ88Soi2Il9）
- H2 · 2026-09-06 02:53 落地 —— 完成 delete/move/select_recipe 在裝置缺失時拋出明確例外（agent: gemini-3.8-flash-high） → O1

### 3 補充 operations Fail-Fast 與 other_info 之單元測試 (Unit Tests for Fail-Fast & other_info)
- **state:** 等待確認
- **basis:** → O1

在 `tests/reversible_operation.test.ts` 新增測試，驗證 `other_info.vanilla_alpha` 欄位結構與找不到裝置時正確觸發 Fail-Fast 例外。

**沿革**

- H1 · 2026-09-06 02:52 決斷 —— 補充 Fail-Fast 與 other_info 測試案例（human: wVQ88Soi2Il9）
- H2 · 2026-09-06 02:53 落地 —— 在 tests/reversible_operation.test.ts 增加 2 項測試並通過驗證（agent: gemini-3.8-flash-high） → O1
