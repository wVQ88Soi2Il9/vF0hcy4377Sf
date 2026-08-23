# Factory Engine

基於 TypeScript 的模組化 $N$ 維網格工廠模擬引擎。
核心負責地圖狀態、擴充掛勾（Hooks）與分支歷史樹（Undo Tree）；遊戲規則、渲染、UI 與資料由 Pack 擴充。

---

## 1. How to Use

### 1.1 啟動與建構

```bash
npm install      # 安裝依賴
npm run dev      # 啟動開發伺服器
npm run build    # 編譯建構
```

### 1.2 CLI 命令列

參數採用 Flag 格式（`--"<arg>"`）：

| 指令 | 語法格式 | 說明 |
| :--- | :--- | :--- |
| `create` | `create --"<def_id>" --"<pos>"` | 建立裝置（座標全為偶數，例：`create --"test:assembler" --"4, 4, 0"`） |
| `move` | `move --"<uid>" --"<pos>"` | 移動裝置（座標全為偶數，例：`move --"1" --"6, 2, 0"`） |
| `delete` | `delete --"<uid>"` | 刪除指定 UID 裝置（例：`delete --"1"`） |
| `info` | `info --"<uid>"` | 查詢指定 UID 裝置詳細資訊（例：`info --"1"`） |
| `camera` | `camera --"<axis>=<depth>"` | 調整觀察視角與切片深度（軸向為 `d<n>`，例：`camera --"d3=0"`） |
| `undo` / `redo` | `undo` / `redo` | 復原 / 重做地圖操作 |
| `jump` | `jump --"<node_uid>"` | 跳轉至指定歷史節點（例：`jump --"2"`） |
| `prev-fork` / `next-fork` | `prev-fork` / `next-fork` | 跳轉至前/後分支分叉點 |
| `history` | `history` | 檢視歷史樹節點清單 |
| `help` | `help` | 顯示所有可用指令 |

### 1.3 Pack 開發基礎

擴充包放置於 `src/packs/{pack_name}/`，啟動時由 `loader.ts` 自動掃描載入：

- 資料定義：`data/items.json`（物品）、`recipes/*.ts`（配方）、`devices/*.ts`（裝置）。
- 邏輯注入：`index.ts` 匯出 `init_pack(): void`，透過 `@/API` 訂閱事件與掛勾。
- 詳細功能：見各 Pack 目錄下之 `README.md`。

---

## 2. Features

- 三層單向架構：`packs` → `utils` → `core`。核心無業務邏輯，提供狀態容器與擴充點。
- 半格解析度網格系統：
  - 裝置錨點為全偶數座標 $(2i, 2j, 2k, \dots)$。
  - 連接埠位於單元格交界面中心，恰 1 軸為偶數、其餘 $n-1$ 軸為奇數。
  - 連通判定比對埠世界座標（`portA === portB`）。
- 分支歷史樹 (Undo Tree)：
  - 基於 `map_command`（`execute` / `inverse`）運作。
  - 支援非線性分支記錄與節點跳轉（透過 LCA 計算重放路徑）。
- 動態配方評估：依據裝置實例狀態計算耗時與輸入/輸出堆疊。
- 切片渲染與 UI：提供 $N$ 維空間 2D 切面 Canvas 投影、樹狀歷史與屬性檢視器。

---

## 3. Something Important

1. 依賴邊界隔離：
   - Pack 僅透過 `@/API` 與 `@/utils/*` 存取，不直接引用 `@/core/*`。
   - 透過 `@/API` 函式訂閱事件，不直接修改 `hooks` 物件。
2. Rely-Pack 單向擴充目錄 (`$<rely_pack>/`)：
   - 擴充被依賴 Pack 時，建立 `$<pack_name>/` 目錄，由自身的 `index.ts` 掃描並註冊。
3. Pack 物件導出：
   - Pack 對外介面封裝為命名物件導出（例：`export const basic_renderer = { ... }`）。
4. 程式碼風格：
   - Allman 大括號（`{` 換行）。
   - 命名使用 `snake_case`（型別、函式、變數、檔案、JSON key）。
   - 陳述句結尾使用分號 `;`，使用半形標點。
