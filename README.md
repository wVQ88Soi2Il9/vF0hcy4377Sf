# Factory Engine

基於 TypeScript 的模組化 $N$ 維網格工廠模擬引擎。

- **core** 只定義型別與純演算法：空間、裝置、可逆操作、歷史樹。
- **world** 持有一次執行中的狀態：空間、歷史樹、各世界獨立的 Hook 清單。
- **pack** 擴充一切具體行為：操作、指令、渲染、UI、CLI、裝置與資料。

---

## 1. How to Use

### 1.1 啟動與建構

```bash
pnpm install     # 安裝依賴
pnpm dev         # 啟動開發伺服器
pnpm build       # tsc -b && vite build
pnpm test        # vitest run，執行 tests/
```

本專案只使用 pnpm（`package.json` 的 `packageManager` 欄位已指定版本）。請勿使用 `npm install`，它會在 pnpm 的 `node_modules` 上失敗，並產生與 `pnpm-lock.yaml` 衝突的 `package-lock.json`。

`tests/` 內目前有一個測試檔使用舊的 registry 形狀，會失敗，尚未修正。

### 1.2 CLI

CLI 位於 `src/packs/cli/`，以空白分詞，雙引號內視為同一個 token。

```text
<command> [args...]
--help
--help <command>
--help <namespace>:<command>
```

- 參數轉型：`true` / `false` / `null`、數字會被轉型，其餘保留為字串。
- 指令名稱可帶命名空間（`namespace:command`）；不帶時依 pack 載入順序查找。
- CLI 會在 registry 的 `commands` 與 `operations` 中查找，兩者在 CLI 看來沒有區別。
- 指令本身由各 pack 在 registry 條目的 `commands` 中註冊，CLI pack 不內建業務指令。

### 1.3 Pack 開發基礎

Pack 放在 `src/packs/<pack_name>/`，由 `index.ts` 匯出生命週期函式：

```ts
export function global_init(registry: core.pack_registry): void
{
    registry.set('my_pack', { pack_id: 'my_pack' /* hooks, operations, commands, ... */ });
}

export function world_init(target_world: world.pure_world): void
{
    // 對這個 world 注入 hook callback
}
```

- 載入順序由 `src/main.ts` 的 `ENABLED_PACKS` 決定。
- 每個 pack 在 registry 中以 `pack_module` 描述自己（`items`、`recipes`、`devices`、`operations`、`commands`、`hooks`、`other_info`）。
- 各 Pack 目錄下的 `README.md`：**待補（todo）**。

---

## 2. Architecture

```text
src/
├── core/        型別與純演算法（definition_i/ii/iii、history）
├── world.ts     pure_world：space + history + hook list
├── main.ts      載入 pack、建立 world
└── packs/       所有擴充
```

### 2.1 core

| 檔案 | 內容 |
|---|---|
| `definition_i.ts` | `uid`、`vector`、`namespaced_id`、hook 型別 |
| `definition_ii.ts` | `item`、`port`、`device`（抽象類別）、`recipe`、`space` |
| `definition_iii.ts` | `rev_op`、`cmd`、`pack_module`、`pack_registry` |
| `history.ts` | 歷史樹與跳轉演算法（獨立於 hooks 與高階流程） |

### 2.2 world 與 Hook

- **Hook 定義是全域的，Hook callback 是各 world 獨立的。** 初始化時各 pack 宣告自己的 hook，彙整成空模板；每個 world 由模板複製出自己的 hook 清單。
- 建立 `pure_world` 時，會對 registry 中每個 pack 呼叫其 `world_init(world)`。
- 詳見 [src/README.md](src/README.md)。

### 2.3 Operation 與 Command

| | operation (`rev_op`) | command (`cmd`) |
|---|---|---|
| 可逆 | 必須可逆（`execute` / `inverse`） | 不要求 |
| 作用對象 | 只作用於 `space` | 不限，例如 undo / redo、調整相機 |
| 進入歷史樹 | 透過 `record_operation` 記錄為節點 | 否 |

### 2.4 半格解析度網格

- 裝置錨點為全偶數座標 $(2i, 2j, 2k, \dots)$。
- 連接埠位於單元格交界面中心：恰 1 軸為偶數、其餘 $n-1$ 軸為奇數。
- 一個單元格在每個軸上佔 2 個座標單位。

### 2.5 分支歷史樹

- 每個節點記錄一組可逆 operation；`undo` 是倒序執行 `inverse`，`redo` 是正序重新 `execute`。
- 節點可有多個子節點，形成分支；任意節點間的跳轉以 LCA 拆解為「先回到 LCA，再前進至目標」。

---

## 3. Packs

| pack | 用途 |
|---|---|
| `vanilla_alpha` | 四個基礎可逆操作（建立、刪除、移動、選定配方）、`std_world`、registry 查詢工具與 hook 定義 |
| `vanilla_beta` | 軸名稱（`d1`、`d2`…）、歷史節點中繼資料（釘選、合併來源）、2× 網格校驗與重疊檢查 |
| `cuboid_device` | 長方體裝置基底類別與形狀產生 |
| `camera` | 以切片將 $N$ 維空間投影為 2D 視圖資料 |
| `basic_renderer` | 將投影資料繪製為 DOM / SVG |
| `basic_ui` | 面板、分割線、UI 根容器與擴充點註冊 |
| `cli` | 字串分詞、指令執行與 `--help` |

---

## 4. Conventions

1. 命名使用 `snake_case`（型別、函式、變數、檔案）。
2. Allman 大括號（`{` 換行），陳述句結尾使用分號，使用半形標點。
3. `import * as core from '@/core'` 與 `import * as world from '@/world'` 以命名空間匯入。
4. 擴充被依賴 Pack 時，使用 `$<pack_name>/` 子目錄由自身 `index.ts` 掃描註冊。目前沒有需要，保留為約定。
5. 避免不必要的全域狀態；不靜默修復非法狀態，保留並強制明確的不變量。

---

## 5. Docs

| 位置 | 內容 |
|---|---|
| `AGENTS.md` / `CLAUDE.md` / `GPT.md` / `GEMINI.md` | 協作與 agent 規則 |
| `docs/QA/` | 設計問答與決策紀錄，規範見 [docs/QA/readme.md](docs/QA/readme.md) |
| `docs/history/` | 計畫歷史，規範見 [docs/history/readme.md](docs/history/readme.md) |
| `src/README.md` | Hook 與 world 的執行期架構 |
