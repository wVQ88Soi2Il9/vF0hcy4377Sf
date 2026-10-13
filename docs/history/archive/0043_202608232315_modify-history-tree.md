# 0043_202608232315_modify-history-tree

- **status:** done
- **prev:** ./0042_202608232304_drag-and-drop-items.md
- **skill:** plan-history v3

## 主題簡述

重構 `history_tree` 歷史樹面板：從原先擠壓主畫面中央的橫向時間軸，改為**左側縱向向下生長之 Git Graph 模式**，且**預設收起**；當使用者展開 / 拉出左側欄時，提供清晰直觀的 Git Graph 分支拓撲與**各節點詳細動作描述**。並支援兩側面板（History Tree 與 Map Status）的雙向收合與展開最小/預設寬度自適應。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 `;`。
- Packs 禁止直接 import `@/core`，只能透過 `@/API` 存取。
- 拒絕隱性補齊。
- 遵循單向依賴與 Object Export 規範。
- 更新後執行 `python docs/history/update-head.py`。

## 規劃描述

1. **實作縱向 Git Graph 拓撲運算與詳細節點清單 (`history_tree_panel.ts`)**：
   - 實作縱向排版演算法（Top-to-Bottom）：深度/時間向下遞增、分支分配到不同水平軌道（Lanes）。
   - 左側繪製 SVG 分支連接線與彩色節點圓點，右側顯示豐富的動作詳細資訊（如指令類型、標籤、目標裝置 UID、座標/食譜參數、HEAD 狀態徽章）。
   - 支援節點點擊直接切換歷史狀態（`jump_to_history`），並保留頂部便捷跳轉控制列。
2. **重構 UI 佈局 (`layout.ts`)**：
   - 將 History Tree 移至畫面最左側欄位（獨立左側邊欄，包含折疊收合按鈕與垂直 Splitter）。
   - 預設收合狀態（Collapsed），釋放中央主畫面空間予 Viewport 與 CLI。
   - 展開時直接佔據 40% 寬度（`40vw`），完整展示 Git Graph 與動作細節。
3. **樣式美化與主題整合 (`style.css`)**：
   - 設計垂直 Git Graph 的節點高亮、當前分支標籤（HEAD）、動作分類圖示與清晰的卡片排版。
4. **修復展開事件聯動與 Map Status 右側欄可收合機制 (`info_panel.ts`, `layout.ts`, `style.css`)**：
   - 修復 History Tree 內部按鈕與外部 Layout Flex/Width 的狀態聯動。
   - 為右側 Map Status 面板加入收合/展開條與最小寬度限制。
5. **Git Graph 經典時序拓撲與平滑 S 彎角連線 (`history_tree_panel.ts`)**：
   - 改採 UID 創建時序拓撲排列，避免分岔節點產生跨多行的長拉線。
   - 分岔處採用平滑 S 曲線（Bézier Elbow）從父節點轉出至新分支軌道，主幹筆直貫穿。
6. **收合側邊條改造與佈局保護 (`history_tree_panel.ts`, `layout.ts`, `style.css`)**：
   - 側邊收合條取消 HISTORY 文字，改為樹狀 Icon 與 6 個快速跳轉鍵。
   - History Tree 展開時固定 Map Status 寬度不被擠壓縮小，由中央 Viewport 自行調整。
7. **Map Status 展開寬度 360px 與 Pipe 建立器介面精緻化 (`pipe_creator_options.ts`, `layout.ts`, `style.css`)**：
   - Map Status 展開時預設寬度為 360px，各項表單寬敞舒適。
   - Pipe 建立器（Segments）：Direction 下拉選單、2n Stepper 輸入框、刪除按鈕等比例縮小精準對齊，新增分段按鈕改為向下三角形（`▼`）。
8. **在 main.ts 建立逼真多分支使用情境（含 jump_to）**：
   - 建立包含多個分支、移動與回溯的擬真歷史情境，開箱即見完整多軌道 Git Graph。
9. **驗證與建構測試**：
   - 驗證各面板預設尺寸、收合切換與建構流程。

## 觀察與推論

### O1 · 2026-08-23 23:15:26+08:00 — 更改 history_tree 需求
使用者指示：new todo 更改history_tree。

### O2 · 2026-08-23 23:22:33+08:00 — 使用者架構決策：分離主畫面、左側縱向 Git Graph、預設收起
使用者提出關鍵架構決策：
1. 歷史樹不該常態與主畫面同時出現，平時僅需 Undo / Redo 快捷操作；當需檢視歷史樹時通常為重大狀態回溯，節點動作細節比主畫面更為關鍵。
2. History tree 改至左側向下生長（縱向 Git Graph），且預設收起來。
3. 拉出 / 展開時，需能清晰看見各節點的詳細動作（Detailed Actions）。

### O3 · 2026-08-23 23:33:16+08:00 — 展開寬度簡化與線條間距優化
使用者指示：
1. 想要簡化為收合/展開（展開固定寬度 `width * 0.4`）。
2. 線再稍微分開，不一定要用貝茲曲線（直/折線經典 Git Graph 拓撲，辨識更清晰）。

### O4 · 2026-08-23 23:35:36+08:00 — 展開事件聯動修復與 Map Status 收合需求
使用者回饋：
1. 展開失敗（內部 toggle 未聯動至外層容器 flex / width）。
2. 右側 Map Status 那邊也要能收合，展開時保有像現在的最小寬度。

### O5 · 2026-08-23 23:40:20+08:00 — 使用者附圖指定 Git Graph 經典拓撲視覺
使用者提供對比截圖：
- 現狀問題：DFS 遍歷導致分岔分支被推到最底部，產生跨越多行的冗長細線。
- 預期效果：如標準 Git Graph，節點緊鄰分岔點時序產生，分岔時由主幹圓點向右以精緻 S 彎角（Bézier Elbow）平滑轉入新分支軌道（如粉色分支），主幹保持筆直連貫。

### O6 · 2026-08-23 23:49:07+08:00 — 收合條 6 鍵與 Map Status 預設收合及佈局保護
使用者指示：
1. 收合時的 HISTORY 文字取消，改為樹狀 icon + 那 6 個按鍵（Root, Prev Fork, Undo, Redo, Next Fork, Leaf）。
2. 展開時不希望縮小 panel.map_status（由中央主畫面自適應承擔，右側欄寬度不被擠壓）。
3. map_status 預設再縮小。

### O7 · 2026-08-23 23:53:01+08:00 — Map Status 預設展開與 CLI 預設收合及高度下調
使用者指示：
1. map status 預設展開。
2. cmd 預設收合，預設展開高度下調。

### O8 · 2026-08-23 23:57:29+08:00 — Map Status 展開 360px 與 main.ts 範例指令初始化
使用者指示：
1. map status 展開時預設為 360px。
2. main.ts 那邊放一些 create/move 以便每次開啟時快速查看。

### O9 · 2026-08-24 00:02:58+08:00 — 擬真多分支情境與 Pipe 建立器介面精緻化
使用者指示：
1. main.ts 裝成已經有人用過的樣子，多放一些並使用 jump_to（呈現多分支狀態）。
2. map_status.create_pipe 改進：direction、input(2n) 縮小，remove 按鈕縮小，new segment 改為往下的三角形。

## 待辦

### 1 實作縱向 Git Graph 佈局計算與詳細節點列元件
- **state:** 完成
- **basis:** → O2

重構 `src/packs/shirones_ui/history_tree_panel.ts`，提供縱向 Git Graph 拓撲計算（SVG 軌道連線 + 節點），並在每列右側展示指令動作名稱、參數與詳細資訊。

**沿革**

- H1 · 2026-08-23 23:15 決斷 —— 開立計畫調整 history_tree（使用者）
- H2 · 2026-08-23 23:24 決斷 —— 確立左側縱向 Git Graph 與詳細動作規格（使用者） → O2
- H3 · 2026-08-23 23:25 落地 —— 完成縱向 Git Graph 拓撲計算與詳細節點列元件實作（Agent） → O2

### 2 重構 UI 佈局將 History Tree 移至左側可收合欄
- **state:** 完成
- **basis:** → O2

修改 `src/packs/shirones_ui/layout.ts`，將 History Tree 設為左側獨立邊欄（預設收合），中央保留給 Viewport 與 CLI，並支援拖曳展開。

**沿革**

- H1 · 2026-08-23 23:24 決斷 —— 開立待辦實作左側可收合邊欄佈局（使用者） → O2
- H2 · 2026-08-23 23:25 落地 —— 完成三欄式佈局重構，將 History Tree 遷移至左側獨立抽屜欄並設為預設收合（Agent） → O2

### 3 樣式設計與詳細動作視覺優化
- **state:** 完成
- **basis:** → O2

更新 `src/packs/shirones_ui/style.css`，完善縱向 Git Graph、彩色分支軌道、HEAD 徽章與節點動作清單樣式。

**沿革**

- H1 · 2026-08-23 23:24 決斷 —— 開立待辦優化 Git Graph 樣式（使用者） → O2
- H2 · 2026-08-23 23:25 落地 —— 完成縱向 Git Graph SVG、節點列、標籤與收合條樣式設計（Agent） → O2

### 4 簡化左側欄展開寬度為 40% (width * 0.4)
- **state:** 完成
- **basis:** → O3

將左側欄收合/展開邏輯簡化，展開時直接佔據視窗 40% 寬度（`40vw`），提供大而清晰的動作檢視視野。

**沿革**

- H1 · 2026-08-23 23:33 決斷 —— 開立待辦簡化收合/展開寬度至 40vw（使用者） → O3
- H2 · 2026-08-23 23:34 落地 —— 簡化 layout 展開寬度為 40vw（`width * 0.4`），收合時為 38px 俐落把手（Agent） → O3

### 5 擴大軌道間距 (Lane Spacing) 與清晰直折線拓撲連線
- **state:** 完成
- **basis:** → O3

增加軌道之間的 X 軸間距，並改用經典 Git Graph 直/折線（Orthogonal / Diagonal Segments）或平滑圓角折線，讓不同分支清晰可辨。

**沿革**

- H1 · 2026-08-23 23:33 決斷 —— 開立待辦擴大間距並改用清晰折線連線（使用者） → O3
- H2 · 2026-08-23 23:34 落地 —— 增加 LANE_WIDTH 至 28px、PAD_X 至 22px，並採用同軌直線與分支折線直角/對角平滑連接（Agent） → O3

### 6 修復 History Tree 展開/收合狀態聯動
- **state:** 完成
- **basis:** → O4

修正 `history_tree_panel.ts` 內部按鈕事件呼叫機制，確保點選展開/收合時同步觸發外層 `history_sidebar` 容器寬度與 flex 變換。

**沿革**

- H1 · 2026-08-23 23:36 決斷 —— 開立待辦修復 History Tree 展開事件聯動（使用者） → O4
- H2 · 2026-08-23 23:37 落地 —— 透過 `on_collapse_change` 回呼完整聯動內部點擊與外部 `history_sidebar` flex/width 切換（Agent） → O4

### 7 實作 Map Status 右側欄可收合機制與最小寬度自適應
- **state:** 完成
- **basis:** → O4

為 `info_panel.ts` 與 `layout.ts` 增加右側欄收合條、展開/收合按鈕與最小寬度限制（收合時 38px，展開時恢復預設/最小寬度 240px）。

**沿革**

- H1 · 2026-08-23 23:36 決斷 —— 開立待辦實作 Map Status 右側欄收合功能（使用者） → O4
- H2 · 2026-08-23 23:37 落地 —— 完成 Map Status 面板收合按鈕、38px 側邊條與展開最小寬度（240px）自適應（Agent） → O4

### 8 實作 UID 時序緊湊排版與經典 Git Graph S 彎角分岔曲線
- **state:** 完成
- **basis:** → O5

重構 `history_tree_panel.ts` 佈局演算法：
1. 按 UID 創建時序（Topological Order）分配 Row，使分岔點子節點緊鄰父節點下方產生，徹底消除跨多行跳躍拉線。
2. 分岔連線繪製平滑 S 曲線（Bézier Elbow）平順過渡至分支軌道，同軌道保持垂直直線貫穿。

**沿革**

- H1 · 2026-08-23 23:42 決斷 —— 開立待辦實作 Git Graph 經典拓撲與 S 彎角曲線（使用者） → O5
- H2 · 2026-08-23 23:43 落地 —— 完成 UID 時序排版與經典 S-curve 分岔彎角實作，完美對齊 Git Graph 截圖樣式（Agent） → O5

### 9 改造收合條為樹狀 Icon 與 6 鍵時空跳轉按鈕
- **state:** 完成
- **basis:** → O6

移除側邊條直式 HISTORY 字樣，置頂樹狀/分支 Icon 展開鈕，並直向排入 6 個跳轉功能按鈕（Root、Prev Fork、Undo、Redo、Next Fork、Leaf）與步數徽章。

**沿革**

- H1 · 2026-08-23 23:50 決斷 —— 開立待辦改造收合條為樹狀 Icon + 6 鍵（使用者） → O6
- H2 · 2026-08-23 23:51 落地 —— 側邊條直向排入樹狀圖標按鈕與 6 個跳轉鍵，完整連動狀態（Agent） → O6

### 10 佈局保護與 Map Status 預設收合
- **state:** 完成
- **basis:** → O6

1. History Tree 展開（40vw）時固定 Map Status 右側欄寬度（不擠壓縮小），所有寬度變化由中央 Viewport 吸收。
2. Map Status 預設收合為 38px 側邊條。

**沿革**

- H1 · 2026-08-23 23:50 決斷 —— 開立待辦實作佈局保護與 Map Status 預設收合（使用者） → O6
- H2 · 2026-08-23 23:51 落地 —— Map Status 預設收合為 38px，且展開時固定寬度不被 History Tree 擠壓（Agent） → O6

### 11 實作 Map Status 展開預設寬度 360px
- **state:** 完成
- **basis:** → O8

將 Map Status 展開時的預設寬度調整為 360px（`flex: 0 0 360px; width: 360px`），並支援最小 240px、最大 600px 之 Splitter 拖曳。

**沿革**

- H1 · 2026-08-23 23:58 決斷 —— 開立待辦調整 Map Status 展開寬度為 360px（使用者） → O8
- H2 · 2026-08-23 23:58 落地 —— Map Status 展開預設寬度設定為 360px（Agent） → O8

### 12 在 main.ts 建立逼真多分支使用情境（含 jump_to）
- **state:** 完成
- **basis:** → O9

在 `main.ts` 初始化時建立多個分支、移動與分支回溯的完整使用紀錄（使用 `jump_to_history` 切換），產生生動的彩色多分支 Git Graph。

**沿革**

- H1 · 2026-08-24 00:04 決斷 —— 開立待辦建立擬真多分支情境（使用者） → O9
- H2 · 2026-08-24 00:05 落地 —— 於 `main.ts` 建立 3 個歷史分支（主幹、分支1、分支2）與 jump_to 回溯（Agent） → O9

### 13 優化 Pipe 建立器介面（Direction、Stepper、Remove 按鈕縮小與向下三角形新增按鈕）
- **state:** 完成
- **basis:** → O9

修改 `pipe_creator_options.ts` 與 `style.css`：
1. Direction 下拉選單寬度精簡（76px）。
2. Delta 步進輸入框寬度縮小（52px）。
3. 刪除按鈕縮小為緊湊正方形按鈕（26px × 26px）。
4. 新增分段按鈕改為向下三角形（`▼`）。

**沿革**

- H1 · 2026-08-24 00:04 決斷 —— 開立待辦優化 Pipe 建立器介面（使用者） → O9
- H2 · 2026-08-24 00:05 落地 —— 精簡 Pipe 介面各元件寬度，刪除鍵縮小為方形，新增鍵改為向下三角形（Agent） → O9

### 14 整合測試與建構驗證
- **state:** 完成
- **basis:** → O9

驗證多分支歷史樹視覺、Pipe 介面按鈕佈局與 `npm run build` 建構流程。

**沿革**

- H1 · 2026-08-24 00:04 決斷 —— 開立待辦進行整合驗證（使用者） → O9
- H2 · 2026-08-24 00:05 落地 —— 通過 `tsc -b && vite build`，0 錯誤（Agent） → O9
