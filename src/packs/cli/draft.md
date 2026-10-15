# cli — 功能草稿

為 cleanroom design 而留:只描述原實作「做了什麼」,不保留程式碼。原實作已刪除;需要原始碼時看 git 歷史(刪除前最後一版:`1aa21ca`)。

## 定位

把一行字串轉成對 registry 中指令的呼叫,並提供 `--help`。CLI 不內建任何業務指令,指令由各 pack 在 registry 條目的 `commands`(以及 `operations`)中提供。

pack id:`cli`,manifest 只有 `pack_id`,沒有 hooks、state、commands。

## 功能

### 1. 分詞(`tokenize_input(input)`)

- 以空白字元切分。
- 雙引號之間的內容視為同一個 token,引號本身不保留。
- 連續空白不產生空 token。

### 2. 參數轉型

指令名稱之後的每個 token 依序轉型:

- `true` / `false` → boolean
- `null` → null
- 非空且能轉成數字 → number
- 其他 → 保留字串

### 3. 指令查找

- **`namespace:id`**:只在該 pack 找。
- **只有 `id`**:依 registry 順序遍歷所有 pack,取第一個找到的。
- 每個 pack 內先找 `commands`,再找 `operations`。
- 找不到:報錯 `Command "<cmd>" not found in registry.`。

### 4. 呼叫

- 目標本身是函式:`target(...args)`。
- 否則:`target.execute(...args)`。
- 回傳呼叫結果。

### 5. 說明(`--help`)

語法:

- `--help`:列出全部指令。
- `--help <id>` 或 `--help <namespace>:<id>`:只顯示該指令。

輸出格式:

- 全部列表:每個有指令的 pack 一段,標頭 `[pack_id]`,下面每行 `  id` 或 `  id - 描述`。沒有任何指令的 pack 不列出。
- 單一指令:`namespace:id` 或 `namespace:id - 描述`。
- 同一個 pack 內,`commands` 與 `operations` 有相同 id 時只列一次(以 `commands` 為準)。

描述來源:指令的 `other_info.cli.describe`,是字串才採用,否則視為無描述。

### 6. Console 綁定

- 可綁定一個 registry 作為 console 使用的 registry;未綁定就執行時報錯。
- 可把一個 runner 掛到 `globalThis.cli`,供 DevTools Console 直接呼叫 `cli("...")`。
- runner 執行後 `console.log` 結果並回傳;出錯時 `console.error` 錯誤訊息後重新丟出。

### 7. 解析輔助(供指令實作使用)

- **`parse_vector(tokens, expected_dim)`**:每個 token 必須是數字,否則報錯;給了維度時長度必須相符,否則報錯;沒有 token 也報錯。
- **`parse_integer(token, field_name)`**:必須是整數,否則報錯,錯誤訊息帶欄位名稱。
