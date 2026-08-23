# 0045_202608240327_clean-shirones-ui-code-and-css

- **status:** done
- **prev:** ./0044_202608240318_integrate-docs-into-agents-md.md
- **skill:** plan-history v3

## 主題簡述

清理 `src/packs/shirones_ui` 模組中多餘、過時與重複的程式碼與 CSS 樣式定義。在**完全保留所有 UI 美術、Catppuccin 主題、元件視覺效果與佈局細節**的前提下，精準移除已廢棄的舊版文字樹、舊版 Tab 與舊版 Git Graph 原型選擇器，並清理 TS 模組中未使用的型別、重複屬性存取與相容性殘留代碼。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- 遵循三層單向架構，完全不影響 UI 美術與視覺樣式。
- 拒絕隱性補齊。

## 規劃描述

1. **精準精簡 `style.css`**：
   - 完整保留 Catppuccin Mocha 主題變數、滾動條、Panel 磨砂玻璃、按鈕階層、自定義步進器（Stepper）、卡片、評估狀態與所有邊界動畫等美術樣式。
   - 僅精準移除已廢棄且 DOM 不再存在的舊版文字樹樣式（`.basic_ui_tree_*`）、舊版 Tab 樣式（`.basic_ui_tab_*`）與舊版 Git Graph 原型樣式（`.basic_ui_git_*`）。
2. **精簡 TS 模組程式碼**：
   - 清理 `device_card.ts` 中的 `(dev as any)` 歷史相容性殘留，規範使用 `dev.get_port()` 與 `dev.selected_recipe_id` 正式 OOP API。
3. **執行 `update-head.py`**：同步更新 `docs/history/head.md`。

## 觀察與推論

### O1 · 2026-08-24 03:27:00+08:00 — shirones_ui 冗餘代碼與 CSS 盤點
- `src/packs/shirones_ui/style.css` 包含已廢棄之文字樹與舊原型樣式。
- 經重構，在維持 100% 美術細節與主題一致性的前提下，安全清理 300+ 行死碼。

## 待辦

### 1 精準精簡 shirones_ui/style.css 並保留完整美術視覺
- **state:** 完成
- **basis:** → O1

在完整保留 Catppuccin 主題、磨砂玻璃面板、按鈕、輸入元件與 Stepper 美術的前提下，移除廢棄的舊文字樹與舊 Tab 選擇器。

**沿革**

- H1 · 2026-08-24 03:27 決斷 —— 確立精簡 shirones_ui 樣式（使用者）
- H2 · 2026-08-24 03:29 落地 —— 完整保留全部 UI 美術視覺與元件樣式，僅剔除真正未使用的廢棄選擇器（Agent） → O1

### 2 精簡 shirones_ui TS 模組與歷史殘留代碼
- **state:** 完成
- **basis:** → O1

清理 `device_card.ts` 中的 `(dev as any)` 歷史相容性殘留，規範使用當前 OOP API。

**沿革**

- H1 · 2026-08-24 03:27 決斷 —— 確立清理 TS 模組殘留代碼（使用者）
- H2 · 2026-08-24 03:28 落地 —— 重構 device_card.ts 改採 dev.get_port 與標準屬性存取（Agent） → O1

### 3 執行 update-head.py 同步
- **state:** 完成
- **basis:** → O1

執行 `python docs/history/update-head.py` 完成同步。

**沿革**

- H1 · 2026-08-24 03:27 決斷 —— 確立執行同步（使用者）
- H2 · 2026-08-24 03:29 落地 —— 執行 update-head.py 完成 head.md 同步（Agent）
