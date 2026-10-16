# basic_ui

## 目的

UI 的基礎零件，不含任何具體畫面。採**平鋪**版面（同 VS Code SplitView）：容器（group）掌管所有子區塊的尺寸，相鄰子區塊之間一律有分割線，分割線不存尺寸。以原生 DOM 實作，遵循最小實作：只處理實際使用會碰到的情況。

下游 pack 在 registry 宣告 panel 的內容；掛載者（例如 `main.ts`）傳入版面樹，決定 panel 放在哪裡、怎麼切分。

## Code

| 檔案 | 內容 |
|---|---|
| `layout_math.ts` | 純函式。`drag_range`、`resize_pair`（只動分割線兩側）、`distribute`（依 weights 等比分配並遵守上下限）、`set_child_size`（收合、展開）、`check_sizes`、`check_limit`、`check_weights`；型別 `limit { min; max }` |
| `extensions.ts` | `list_panels(registry)`：讀 `other_info.basic_ui.panels`，回傳 `pack_id → 名稱 → 宣告` 的雙層 map |
| `layout_tree.ts` | 版面樹型別與 `check_layout(layout, declarations)` |
| `group.ts` | 內部：一個 group 的 DOM、拖曳、縮放、收合狀態（不由 `index.ts` 匯出） |
| `root.ts` | `mount_ui_root(container, target_world, layout)`：回傳 `ui_root { element, panels }` |
| `validate.ts` | 內部：檢查物件與未知鍵、錯誤訊息的 panel 標示（不由 `index.ts` 匯出） |
| `index.ts` | `manifest { pack_id: 'basic_ui' }` 與上述公開 API |

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

- `basic_ui` 命名空間只接受 `panels`；宣告只接受 `render`；未知鍵報錯。
- slot 為 `overflow: hidden`；內容需要捲動時，panel 自己的元素要設 `height: 100%; overflow: auto`（或對應寬度）。
- `render` 必須回傳全新、未放置、彼此不同的 `HTMLElement`，且應無副作用：後面的檢查失敗時，已呼叫的 `render` 不會被還原。
- 宣告在 registry；`mount_ui_root` 在掛載時讀取一次，執行期沒有取消註冊。

## 版面樹

```ts
type layout_node =
    | { kind: 'group'; axis: 'x' | 'y'; children: layout_child[] }
    | { kind: 'panel'; panel: { namespace: pack_id; id: name } };

type layout_child =
    | { node; size; min; max; collapsible: false }
    | { node; size; min; max; collapsible: true; collapsed_size };   // 只限 panel 子區塊
```

- `size`、`min`、`max` 為沿父 group 軸的 px：`min` 為有限非負數，`max ≥ min`（可為 `Infinity`），`size` 落在 `[min, max]`。
- `collapsible: true` 時必須給 `0 ≤ collapsed_size ≤ min`；`collapsible: false` 時不可有 `collapsed_size`。
- 每個宣告的 panel 恰好出現一次；引用不存在的 panel、重複放置、空 group、未知鍵都報錯。
- 根節點可以是 group 或單一 panel（單一 panel 不能收合）。
- 驗證後直接使用傳入的物件，掛載後不要再修改它。

## 行為

- **尺寸**：每個 group 以 `ResizeObserver` 量自身沿軸的長度，扣掉分割線（每條 4px）後依 weights 分配。只有交叉軸變化時不重排。
- **weights（比例）**：初始為版面樹的 `size`；拖曳結束（有實際移動）與展開後由目前尺寸更新；收合不更新。容器放不下所有 min（溢出或容器為 0）時不更新，收合中的子區塊保留原 weight。
- **溢出**：容器小於所有 min 的總和時，子區塊保持 min，group 可捲動，不報錯。
- **拖曳**：主要按鍵、`isPrimary`、pointer capture；`pointerup`、`pointercancel`、`lostpointercapture` 結束拖曳；`touch-action: none`。同一 group 一次只拖一條分割線。拖曳中容器縮放時，以重排後的尺寸為拖曳起點。收合中的子區塊鄰接的分割線拖不動。
- **收合**：透過 `ui_root.panels.get(pack_id)!.get(name)!` 的 `collapse()` / `expand()`；騰出的空間依比例分給其他兄弟；展開時回到收合前的 px（同 VS Code；收合時溢出則改用其 weight），再夾在自己的上下限以及兄弟能讓出的範圍內。收合、展開會結束同一 group 內的拖曳；重複呼叫不做事。掛載時全部展開。
- **container**：必須已接上 document，且有確定的寬高（根容器為 100% × 100%）。同一 document 只能有一個根容器（以 `[data-basic_ui_root]` 判斷）。

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
- 只在 happy-dom 測過；捲軸、次像素 flex-basis、實際 pointer capture 需在真實瀏覽器確認。
