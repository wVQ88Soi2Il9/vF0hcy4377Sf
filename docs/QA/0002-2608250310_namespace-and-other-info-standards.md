# 0002-2608250310_namespace-and-other-info-standards

- **status:** resolved
- **topic:** 命名空間（Namespace）型態收斂與 other_info 擴充規範

## 提問與回答

### Q1 · 2026-08-25 03:08（human: wVQ88Soi2Il9）
我要重新理解 namespace 的問題，現在 namespace 有幾種型態？據我所知某些東西是在 index 當物件 export，現在是 string 的樣子，這是不是有些混亂？

### A1 · 2026-08-25 03:09（agent: gemini-3.7-flash）
是的，先前在不同層級上確實存在概念混淆與不一致，主要表現在：
1. **`$` 符號意涵混淆**：既在目錄結構中使用（`$basic_ui/` 代表擴充目錄），又在資料結構中使用（`$vanilla` 作為私有屬性 key）。
2. **`other_info` 標準不一**：有的地方帶 `$` 子物件（`$vanilla: { pinned: true }`），有的地方平鋪參數（`{ device_uid, position }`），缺乏統一邊界。
3. **字串 ID 與物件 Export 的層次未明定**：代碼模組導出（TS 物件）與全域查表識別（冒號字串 ID）沒有清晰界定。

為了徹底解決此混亂，系統正式確立以下標準化原則：
1. **全域資源 / 指令 ID（String ID）**：一律強制採 `<pack_id>:<name>` 格式（例如 `core:create_device`、`test:assembler`、`pipe:straight_pipe`），零例外。
2. **動態實體擴充袋（`other_info`）**：Core 的通用開放容器（`device`、`history_node`、`map_command`）若需被 Pack 擴充，強制以自身 `<pack_id>` 作為子物件 Key（例 `node.other_info = { vanilla: { pinned: true, merged_from: 3 } }`），禁止平鋪且不帶 `$` 前綴。
3. **跨模組擴充目錄**：`$` 符號專屬於檔案系統（例如 `src/packs/pipe/$basic_ui/`），代碼內資料結構完全不使用 `$`。
4. **Pack 模組介面**：Pack 的公開 API 統一於其 `index.ts` 封裝為命名物件導出（例如 `export const vanilla = { ... }`）。

### Q2 · 2026-08-25 03:12（human: wVQ88Soi2Il9）
為什麼「資源與指令 ID：全域一律強制為 `<pack_id>:<name>` 冒號字串」不使用第 4 種方法（結構化物件）？

### A2 · 2026-08-25 03:13（agent: gemini-3.7-flash）
冒號字串適合快速比對與序列化，但結構化物件（`namespaced_id { pack, id }`）搭配兩層 Map 階層註冊（`Map<pack_id, Map<resource_id, T>>`）具備更高的語意純粹性與架構優勢：
1. **Mod 卸載極其純粹（$O(1)$ Unload）**：卸載 Pack 只要直接 `delete(pack_id)` 其專屬子 Map，零字串過濾遍歷。
2. **實體內部結構化**：`device`、`map_command`、`item_definition`、`recipe` 均明確擁有 `pack` 與 `id` 欄位，無需頻繁 `split(':')`。
3. **查表相容性**：`get_device_class`、`get_recipe`、`get_item` 等查詢 API 同時支援傳入結構化物件 `{ pack, id }` 或便利字串 `pack:id`，在享受結構化好處的同時維持 CLI/JSON 傳遞的簡潔。

## 結論
1. **核心實體全面結構化**：`namespaced_id` 介面（`pack: string; id: string;`），所有實體（Item, Recipe, Device, Command）均具備獨立的 `pack` 與 `id` 屬性。
2. **Registry 採用兩層階層式 Map**：`Map<pack_id, Map<resource_id, T>>`，Pack 卸載為 $O(1)$ 刪除子 Map。
3. **字串 `<pack>:<id>` 定位**：僅作為 CLI 輸入與 JSON 序列化傳遞時的便利標記法。
4. **`other_info` 擴充**：強制以 `<pack_id>` 為 Key 包裹子物件，不帶 `$` 符號。
5. **目錄結構**：`$` 符號專屬於跨 Pack 擴充目錄（`$<rely_pack>/`）。
