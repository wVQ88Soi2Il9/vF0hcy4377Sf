# UI 功能規格

本清單由 `shirones_ui` 的可觀察行為整理。重寫階段只依本清單與上游契約，不搬用舊版 TS、CSS 或 DOM 結構。

1. **版面**：左側歷史、中央 Viewport、中央底部 CLI、右側狀態。歷史／狀態預設收合為 38px，CLI 為 40px；展開後可拖曳分隔線。收合再展開保留拖曳尺寸，收合時隱藏對應分隔線。使用 panel 的 resize/reset API。
2. **Viewport**：提供可放入畫布的容器；縮放顯示以 40 為 100%，放大乘 1.25、縮小乘 0.8，按鈕範圍 10–200，重設 40，可由外部更新顯示。來源沒有相機接線或實際繪圖。
3. **CLI**：Enter 執行指定 world 的 CLI，顯示最近結果、成功／錯誤狀態、清空輸入並展開輸出。可手動收合。使用目前 CLI 的 `--help` 語法。
4. **狀態**：設備數、空間各維尺寸、UID 選單；檢視指定設備會展開側欄。設備消失後清除選取。設備與歷史事件會更新畫面。
5. **建立設備**：registry 中的 namespace → device 兩級排序選單，可刷新；依空間維度輸入座標，支援每次 ±2，只接受有效偶整數。建立選項擴充的 other_info 依序合併；成功後選取新設備，失敗顯示錯誤。
6. **設備卡**：UID、完整 definition ID、位置與移動、刪除、所有 registry recipes 選擇及取消、ports UID／方向／offset、可選 validate 結果、額外欄位與 other_info。設備操作記錄歷史並通知 vanilla_alpha hooks。
7. **歷史**：以分支圖表達父子關係，節點依建立順序倒序排列，分支區分顏色；顯示 UID、操作摘要、HEAD、目前祖先路徑、pin。切換 HEAD 時捲至目前節點，其他刷新保留捲動位置。
8. **歷史操作**：根、上一分岔、undo、redo、下一分岔／末端；收合時仍可導航並顯示 HEAD UID。分岔點不可任選 redo 分支，需點選節點跳轉。支援 pin、刪除非目前 leaf（含右鍵）、刪除不含目前路徑的子樹；根不可刪。
9. **擴充**：依 predicate 選擇設備 inspector 與建立選項，額外設備 actions，可依 ID 取代且按 priority 排序的狀態 sections；提供註冊、移除、查詢、全清除與 unsubscribe。
10. **使用方式**：pack 可註冊至 registry；UI 建立時明確指定 world，可單獨建立面板，也可建立完整 layout。

## 重寫界線

- 不以舊版檔名、CSS、singleton bound_world 或 DOM ID 作為功能需求；新 UI 狀態由各實例持有，擴充 registry 可明確共用。
- 舊版提示 Ctrl+Z／Ctrl+Y 但沒有鍵盤實作，不列為既有功能。
- 舊版有 pipe CSS，但没有 pipe 建立元件，不列入功能。
- 不保留小數被 parseInt 截斷、CLI throw 沒顯示錯誤、初始統計未填入、外部更新縮放後按鈕使用舊值等缺陷。
- 本次新增獨立 pack 與驗證入口；既有主入口由 Human 決定何時切換。
