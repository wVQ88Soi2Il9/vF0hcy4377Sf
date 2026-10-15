# basic_ui

## 目的

UI 的基礎零件，不含任何具體畫面。採**平鋪**版面（同 VS Code SplitView）：容器（group）掌管所有子區塊的尺寸，相鄰子區塊之間一律有分割線，分割線不存尺寸。以原生 DOM 實作。

下游 pack 在 registry 宣告 panel 的內容；掛載者（例如 `main.ts`）傳入版面樹，決定 panel 放在哪裡、怎麼切分。

## Code

| 檔案 | 內容 |
|---|---|
| `layout_math.ts` | 純函式。`drag_range`、`resize_pair`（只動分割線兩側）、`distribute`（依 weights 等比分配並遵守上下限）、`set_child_size`（收合、展開）、`check_sizes`、`check_limit`、`check_weights`；型別 `limit { min; max }` |
| `extensions.ts` | `list_panels(registry)`：讀 `other_info.basic_ui.panels`，回傳 `pack_id → 名稱 → 宣告` 的唯讀雙層 map |
| `layout_tree.ts` | 版面樹型別與 `check_layout(layout, declarations)`：驗證並回傳深度凍結的副本 |
| `group.ts` | 內部：一個 group 的 DOM、拖曳、縮放、收合狀態（不由 `index.ts` 匯出） |
| `root.ts` | `mount_ui_root(container, target_world, layout)`：回傳 `ui_root { element, panels, unmount }` |
| `validate.ts` | 內部：只讀純物件自身資料屬性的驗證工具（不由 `index.ts` 匯出） |
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
- `other_info` 必須是物件；`basic_ui` 命名空間、`panels`、各宣告與版面樹必須是純物件（原型為 `Object.prototype` 或 `null`），只含自身可列舉的資料屬性；getter、symbol 鍵、繼承屬性、陣列空洞都報錯。
- `render` 必須回傳本 document 中全新、未放置、彼此不同的 `HTMLElement`，且應無副作用：後面的檢查失敗時，已呼叫的 `render` 不會被還原。
- 宣告在 registry；`mount_ui_root` 在掛載時讀取一次（快照），之後改 registry 不影響已掛載的介面。執行期沒有取消註冊。

## 版面樹

```ts
type layout_node =
    | { kind: 'group'; axis: 'x' | 'y'; children: layout_child[] }
    | { kind: 'panel'; panel: { namespace: pack_id; id: name } };

type layout_child =
    | { node; size; min; max; collapsible: false }
    | { node; size; min; max; collapsible: true; collapsed_size };   // 只限 panel 子區塊
```

- `size`、`min`、`max` 為沿父 group 軸的 px：`min` 為有限非負數，`max ≥ min`（可為 `Infinity`），`size` 為落在 `[min, max]` 的有限數。
- `collapsible: true` 時必須給 `0 ≤ collapsed_size ≤ min`；`collapsible: false` 時不可有 `collapsed_size` 鍵。
- 每個宣告的 panel 恰好出現一次；引用不存在的 panel、重複放置、空 group、同一節點物件重複出現都報錯。
- 根節點可以是 group 或單一 panel（單一 panel 不能收合）。

## 行為

- **尺寸**：每個 group 以 `ResizeObserver` 量自身沿軸的長度，扣掉分割線（每條 4px）後依 weights 分配。只有交叉軸變化時不重排。
- **weights（比例）**：初始為版面樹的 `size`；在使用者拖曳結束、拖曳中容器縮放（兩者都要拖曳已實際移動）、以及展開結果與現有比例不同時，由目前尺寸更新；收合不更新。尺寸受整體上下限強制時（溢出、等於 min 總和、容器為 0、全部到 max）不更新，收合中的子區塊保留原 weight。
- **溢出**：容器小於所有 min 的總和時，子區塊保持 min，group 可捲動，不報錯。
- **拖曳**：主要按鍵、`isPrimary`、pointer capture；`pointerup`、`pointercancel`、`lostpointercapture` 結束拖曳；`touch-action: none`。拖曳中容器縮放時，先保留拖曳結果再重排，不跳動。同一 group 拖曳中再按下其他分割線會被忽略；拖曳狀態殘留（capture 在別處遺失）時，下一次按下會先清除。收合中的子區塊上下限固定，鄰接的分割線拖不動。
- **收合**：透過 `ui_root.panels.get(pack_id)!.get(name)!` 的 `collapse()` / `expand()`；騰出的空間依比例分給其他兄弟；展開時回到收合前的 px（同 VS Code；收合時尺寸受強制則改用其 weight），再夾在自己的上下限以及兄弟能讓出的範圍內（填滿容器）。收合、展開會結束同一 group 內進行中的拖曳；重複收合或展開不做事。掛載時全部展開。
- **卸載**：`unmount()` 停止觀察、結束拖曳並釋放 pointer capture、移除根容器；之後 handle 呼叫與再次 `unmount()` 報錯。可再次掛載，會重新呼叫所有 `render`。
- **container**：必須是有 window 的 document 中的 `HTMLElement`，已接上 document、不在 shadow root 內，且有確定的寬高（根容器為 100% × 100%）；環境須有 `ResizeObserver`。同一 document 只能有一個根容器（以 `[data-basic_ui_root]` 判斷）。

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
- 沒有任何 panel 時版面樹無法合法（docket plan 20261015204853）。
- `src/main.ts` 尚未啟用此 pack 或呼叫 `mount_ui_root`；CLI 的輸入介面由 basic_ui 控制（docket fact 20261015184045），尚未實作。
- 展開後的尺寸與現有比例的分配不同（例如收合期間容器縮放過）時才更新比例；此時若鄰居被部分夾在上下限，夾限後的尺寸會存成比例。
- 只在 happy-dom 測過；捲軸、次像素 flex-basis、實際 pointer capture 需在真實瀏覽器確認。
