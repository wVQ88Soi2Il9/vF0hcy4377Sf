# basic_ui

## 目的

UI 的基礎零件，不含任何具體畫面。採**平鋪**版面：版面是一棵樹，內部節點（group）沿一個軸切分、掌管子區塊的比例，葉節點是 panel；相鄰子區塊之間一律有分割線，分割線不存尺寸。以原生 DOM 實作，尺寸分配交給瀏覽器的 flexbox、結構檢查交給 TypeScript，遵循最小實作：只處理實際使用會碰到的情況。

下游 pack 在 registry 宣告 panel 的內容；掛載者（例如 `main.ts`）傳入版面樹，決定 panel 放在哪裡、怎麼切分。

## Code

| 檔案 | 內容 |
|---|---|
| `extensions.ts` | `list_panels(registry)`：讀 `other_info.basic_ui.panels`，回傳 `pack_id → 名稱 → 宣告` 的雙層 map；`panel_label` |
| `layout_tree.ts` | 版面樹型別與 `check_layout(layout, declarations)` |
| `group.ts` | 內部：一個 group 的 DOM、weights、拖曳、收合狀態（不由 `index.ts` 匯出） |
| `root.ts` | `mount_ui_root(container, target_world, layout)`：回傳 `ui_root { element, panels }` |
| `index.ts` | `manifest { pack_id: 'basic_ui' }` 與上述公開 API |

## 驗證

結構交給 TypeScript：`mount_ui_root` 的 `layout` 參數型別為 `layout_node`，必填欄位與 union 由編譯器保證（例如只有 panel 子區塊能設 `collapsible: true`）。執行期只檢查型別表達不了的語意：

- `0 ≤ min ≤ size ≤ max`，`min`、`size` 為有限數（`max` 可為 `Infinity`）；`0 ≤ collapsed_size ≤ min`。
- group 至少有一個子區塊。
- 引用的 panel 存在；每個宣告的 panel 恰好出現一次。
- `render` 是函式（`other_info` 型別為 `Record<string, unknown>`，編譯器檢查不到）；回傳的元素是全新、未放置、彼此不同的。

## 宣告 panel

```ts
provides:
{
    other_info:
    {
        basic_ui:
        {
            panels: { [name]: { render(target_world): HTMLElement } }
        }
    }
}
```

- slot 為 `overflow: hidden`；內容需要捲動時，panel 自己的元素要設 `height: 100%; overflow: auto`（或對應寬度）。
- `render` 應無副作用：後面的檢查失敗時，已呼叫的 `render` 不會被還原。
- 宣告在 registry；`mount_ui_root` 在掛載時讀取一次，執行期沒有取消註冊。

## 版面樹

```ts
type layout_node =
    | { kind: 'group'; axis: 'x' | 'y'; children: layout_child[] }
    | { kind: 'panel'; panel: { namespace: pack_id; id: name } };

type layout_child =
    | { node: layout_node;  size; min; max; collapsible: false }
    | { node: layout_panel; size; min; max; collapsible: true; collapsed_size };
```

- `size`、`min`、`max` 為沿父 group 軸的 px。
- 根節點可以是 group 或單一 panel（單一 panel 不能收合）。

## 行為

- **尺寸**：每個 slot 為 `flex: <weight> 1 0px`，並以 `min-width` / `max-width`（y 軸為 height）設上下限。容器縮放時由瀏覽器依 weights 等比分配、夾在上下限內。分割線每條 4px。
- **weights（比例）**：初始為版面樹的 `size`（容器長度剛好等於 size 總和加分割線時，每塊就是 size px）。只有拖曳會改 weights。
- **溢出**：容器小於所有 min 的總和時，子區塊停在 min，group 可捲動，不報錯（flexbox 的行為）。
- **拖曳**：按下時量各子區塊目前的 px（次像素誤差夾回上下限）；移動時只動分割線兩側並夾在各自上下限內，再把所有展開中子區塊的 weights 改為與目前 px 成比例、維持原 weight 總和（flexbox 依此分配會剛好重現畫面，其他子區塊不會跳動；收合中子區塊的 weight 仍在同一尺度）。尺寸還沒真正改變時（原地按下、溢出時兩側都卡在上下限）不動 weights。主要按鍵、`isPrimary`、pointer capture；`pointerup`、`pointercancel`、`lostpointercapture` 結束拖曳；`touch-action: none`。同一 group 一次只拖一條分割線；鄰接收合中子區塊的分割線不啟動拖曳。
- **收合**：透過 `ui_root.panels.get(pack_id)!.get(name)!` 的 `collapse()` / `expand()`。收合把 slot 固定為 `collapsed_size` px，騰出的空間由瀏覽器依比例分給兄弟；展開恢復原本的 weight。收合、展開會結束同一 group 內的拖曳。掛載時全部展開。
- **container**：必須已接上 document，且有確定的寬高（根容器為 100% × 100%）。同一 document 只能有一個根容器（以 `[data-basic_ui_root]` 判斷）。DOM 先在 container 外建好，中途報錯時 container 不變。

## DOM 屬性

| 屬性 | 位置 |
|---|---|
| `data-basic_ui_root` | 根容器 |
| `data-basic_ui_group="x" / "y"` | group 元素 |
| `data-basic_ui_slot="i"` | group 內第 i 個子區塊的外框；`data-basic_ui_collapsed="true" / "false"` 標示收合狀態 |
| `data-basic_ui_separator="i"` | 第 i 條分割線（位於 slot i 與 i + 1 之間） |
| `data-basic_ui_pack`、`data-basic_ui_name` | panel 的內容元素（`render` 的回傳值） |

## Todo

- 樣式之後改用 Tailwind（`vite.config.ts` 尚未啟用 `@tailwindcss/vite`）；目前只有功能所需的 inline style 與 `data-basic_ui_*` 屬性。
- 沒有卸載（unmount）；需要時再加。
- 沒有任何 panel 時版面樹無法合法（docket plan 20261015204853）。
- `src/main.ts` 目前以 `basic_ui_demo` 的版面掛載（驗收用）；CLI 的輸入介面由 basic_ui 控制（docket fact 20261015184045），尚未實作。
- DOM 測試在 happy-dom（沒有版面計算）；實際尺寸分配已在瀏覽器手動確認過（拖曳、收合、縮放到溢出再放大）。
