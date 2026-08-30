# 2608250130_core-vs-api-wrapper

- **status:** resolved
- **topic:** 為什麼 Core 與 API.ts 需要分層封裝？

## 提問與回答

### Q1 · 2026-08-25 01:23（使用者）
我沒有很理解，為什麼 `API.ts` 那邊要再包裝一次？為什麼不能在 `core` 裡面包裝好？

### A1 · 2026-08-25 01:24（agent: gemini-3.7-flash）
主要有兩大核心架構原因：

1. **避免循環依賴（Circular Dependency）**：
   - 全域實例（如當前 `global_history_tree`）儲存在 `src/runtime.ts` 中。
   - `runtime.ts` 需要引用 `src/core/` 的建構函式（如 `create_history_tree()`）進行初始化。
   - 若 `core` 內部直接去拿全域實例，就會產生 `core <-> runtime` 相互引用的循環依賴問題。

2. **保持 Core 的純度與多實例彈性（Zero Global State）**：
   - `src/core/` 保持純演算法與純資料結構容器（接收 `tree` / `map` 作為參數），使得單元測試極其簡單，且未來若需要支援多地圖或背景沙盒分支預演時，Core 能同時操作多棵樹而不受全域單例束縛。
   - `src/API.ts` 則是門面（Facade），負責將當前 Runtime 全域狀態注入並傳入 Core 純函式，使 Pack（UI/CLI）開發者呼叫時可享受 `delete_node(3)` 或 `undo()` 的直觀語意，而不需手動提取實例。

## 結論
`src/core/` 專注於純數學結構與演算法（零外部全域依賴）；`src/API.ts` 作為門面自動注入 Runtime 全域實例，分工清晰且杜絕循環依賴。

#core #architecture
