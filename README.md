# Factory Engine

基於 TypeScript 的模組化 $N$ 維網格工廠模擬引擎。

- **core** 只定義型別與純演算法：空間、裝置、可逆操作、歷史樹。
- **world** 持有一次執行中的狀態：空間、歷史樹、各 pack 的私有狀態；Hook 定義在全域 catalog，world 以參數傳入。
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

### 1.2 CLI

CLI 位於 `src/packs/cli/`，以空白分詞，引號（`'` 或 `"`）內視為同一個 token。

```text
<command> [args...]
help
help <command>
help <namespace>:<command>
```

- 參數轉型：`true` / `false` / `null`、數字會被轉型，其餘保留為字串；引號內與 16 位 hex（uid）一律為字串。
- 指令名稱可帶命名空間（`namespace:command`）；不帶時必須只有一個 pack 有這個名稱，否則報錯並列出候選。
- CLI 會在 registry 的 `commands` 與 `op_templates` 中查找，兩者在 CLI 看來沒有區別；`op_template` 產生的 `rev_op` 會經 `submit` 寫入歷史。
- `cli.run(world, context, line)`：`context` 由呼叫端決定，原樣傳給 `cmd.execute`。
- 指令本身由各 pack 在 manifest 的 `provides.commands` / `provides.op_templates` 註冊，CLI pack 只內建 `help`。

### 1.3 Pack 開發基礎

Pack 放在 `src/packs/<pack_name>/`，由 `index.ts` 匯出 `manifest`：

```ts
export const manifest: core.pack_manifest =
{
    pack_id:      'my_pack',
    provides:     { devices, op_templates, commands, other_info /* ... */ },
    on:           { 'core:committed': (target_world, change_set) => { /* ... */ } },
    create_state: () => ({ /* 每個 world 一份的私有狀態 */ })
};
```

- 載入順序由 `src/main.ts` 的 `ENABLED_PACKS` 決定，`world.compose` 依序組裝成 catalog。
- 各 pack 目錄下有自己的 `README.md`。

---

## 2. Architecture

```text
src/
├── core/        型別與純演算法（definition_i/ii/iii、history）
├── world.ts     compose 與 pure_world：space + history + pack_state
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

- **Hook 定義是全域的，world 透過參數傳入。** `compose` 把各 pack 的 `on` 合併進 catalog；handler 只操作它收到的 world，所以不同 world 之間互不影響。
- 建立 `pure_world` 時，以各 pack 的 `create_state` 產生該 world 的 `pack_state`。
- `submit` / `undo` / `redo` / `jump_*` 是唯一的寫入路徑，游標移動後發出 `core:committed`。
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
| `vanilla_alpha` | 四個基礎可逆操作的 `op_template`（建立、刪除、移動、選定配方；不登記）、registry 查詢工具 |
| `vanilla_beta` | 把四個操作包成 `op_templates`、軸名稱、歷史節點中繼資料、2× 網格校驗與重疊檢查、`build_graph` |
| `vanilla_gamma` | `evaluate_world`：依 `vanilla_beta` 的圖求穩態流量（反壓）；運轉規則與 `select_rule` |
| `cuboid_device` | 長方體裝置基底類別與形狀產生 |
| `pipe` | 起點 + 位移段轉成管線裝置（未啟用） |
| `camera` | 以切片將 $N$ 維空間投影為 2D；每個 world 的視角狀態與 `view` 指令 |
| `basic_renderer` | 將投影繪製為 SVG 圖層；`drawable` mixin |
| `panel` | 平鋪版面、分割線、UI 根容器與 panel 擴充點 |
| `panel_demo` | 驗收 `panel` 的示範（未啟用） |
| `cli` | 字串分詞、指令查找與執行、`help` |
| `test_ui` | 測試用介面：history、view、edit、cli 四個 panel 與示範裝置 |
| `test` | 只供 `tests/` 使用的裝置與 recipe |

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
| `AGENTS.md` / `CLAUDE.md` | 協作與 agent 規則 |
| `docs/archive/QA/` | 設計問答與決策紀錄（已封存），規範見 [docs/archive/QA/readme.md](docs/archive/QA/readme.md) |
| `docs/docket/` | 事實與計畫紀錄（append-only），規範見 [docs/docket/README.md](docs/docket/README.md) |
| `src/README.md` | Hook 與 world 的執行期架構 |
