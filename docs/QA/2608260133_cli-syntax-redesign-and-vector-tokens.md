# 2608260133_cli-syntax-redesign-and-vector-tokens

- **status:** resolved
- **topic:** CLI 指令語法重構（舊有旗標格式問題、空格 vs 分號、連續數字向量解析之架構權衡）

## 提問與回答

### Q1 · 2026-08-26 01:06（human: wVQ88Soi2Il9）
1. `execute_command` 沒有正常運作。
2. 我打算換成更好的格式，我認為現在的 `cmd --<arg1> --<arg2>` 相當反人類，像是融合了 minecraft + 傳統 bat 的奇美拉。

### A1 · 2026-08-26 01:06（agent: gemini-3.7-flash-medium）
當前 `execute_command` 無法正常運作的主因有三：
1. **型別簽名直接斷裂**：CLI 分詞輸出純字串，但 Core 核心指令（如 `create_device_command`）需要接收建構類別 `device_constructor`、字串 ID 與數字陣列 `vector`。執行器直接將純字串傳入導致 `new device_class(...)` 噴出 `TypeError`。
2. **缺少「識別碼 → 類別」查表轉譯層**：CLI 輸入之字串 ID（如 `vanilla:conveyor`）未在適配層解析為建構子與標準座標。
3. **歷程指令（undo/redo/jump 等）未註冊至 Core Registry**：歷史樹控制函式目前僅存在於 `runtime.ts`，未作為指令公開。

原先的 `--"<arg>"` 語法確實將旗標語法與位置參數混用，增加大量輸入負擔。

---

### Q2 · 2026-08-26 01:09（human: wVQ88Soi2Il9）
為什麼我們不用 `;` 分隔？除了空格還有什麼方式？

### A2 · 2026-08-26 01:09（agent: gemini-3.7-flash-medium）
1. **不建議用 `;` 作為參數分隔的主因**：
   - **鍵盤人體工學**：空白鍵為鍵盤最大鍵，盲打體驗最佳；`;` 在右手小指常態區，連續輸入負擔大。
   - **多指令批次串聯（Command Chaining）**：在所有 Shell 與程式語言中，`;` 的世界標準為「語句結束 / 執行下一條指令」（如 `create conveyor 0 0; move 1 2 2`）。若保留 `;` 用於命令串接，可支援單行多操作。
2. **除了空格之外的語法典範**：
   - 介系詞 DSL 風（`create conveyor at 4 4 0`）
   - 函式呼叫 REPL 風（`create("conveyor", [4, 4, 0])`）
   - 鍵值對風（`create id=conveyor pos=4,4,0`）
   - POSIX 旗標風（`create conveyor -p 4 4 0`）
   - 純位置參數風（`create conveyor 4 4 0`）

---

### Q3 · 2026-08-26 01:29 ~ 01:31（human: wVQ88Soi2Il9）
在純位置 (Minecraft/Redis) 風格下，連續數字是否真的該用空格？
從維護者角度思考，連續數字未必不好：
1. dimension 是固定的。
2. 每格都是 number，可以快速整合成 vector。

### A3 · 2026-08-26 01:31（agent: gemini-3.7-flash-medium）
深度探討連續數字向量的表示方式（逗號聚合 `4,4,0` vs 連續空格數字 `4 4 0`）：

1. **逗號聚合方案（`create conveyor 4,4,0`）**：
   - **優點**：Token 數量永遠固定（`tokens[2]` 永遠是座標），不依賴維度或 runtime 狀態；邊界清晰。
   - **缺點**：輸入需打逗號 `,`；底層需要做二次字串 `.split(',')`。

2. **連續空格數字方案（`create conveyor 4 4 0`）**：
   - **優點**：
     - **零二次字串切割**：分詞器一次產出原子 Token，直接 `args.slice(1).map(Number)` 完成轉換。
     - **尾隨向量規律性**：所有含座標指令（`create`, `move`）的向量均位於參數尾端，長度與當前地圖維度完全相符。
     - **嚴格維度驗證**：比對 `tokens.length === dim`，防呆且無隱性補齊。
   - **缺點/注意點**：需在執行層依據目前地圖維度檢驗參數長度。

---

### Q4 · 2026-08-26 01:36（human: wVQ88Soi2Il9）
確定用 4 4 0 (空格分開)，proceed。

### A4 · 2026-08-26 01:36（agent: gemini-3.7-flash-high）
確認採用「純位置參數 + 空格連續數字向量」格式，並立即依此結論進行全面重構與修復。

## 結論
正式確立 CLI 命令列語法標準：
1. **純空格位置參數**：採用 `cmd <arg1> <arg2> ...` 格式，徹底廢除 `--"<arg>"` 奇美拉包裝。
2. **連續空格數字向量**：座標與向量一律以空格分隔連續數字（如 `create conveyor 4 4 0`、`move 1 6 6 0`），由分詞器產出原子 Token 後直接透過 `parse_vector` 依地圖維度嚴格檢驗並轉為 `number[]`。
3. **指令適配層健全化**：`cli_tool` 內建型別轉譯與適配管線，自動處理識別碼查表、偶數錨點校驗與歷程控制指令分派。
#cli #parser