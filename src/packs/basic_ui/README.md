# basic_ui

## 目的

UI 的基礎零件，不含任何具體畫面。其他 pack 用它組出介面，或在 registry 宣告 panel 掛進介面。以原生 DOM 實作。

## Code

| 檔案 | 內容 |
|---|---|
| `panel.ts` | `create_panel(content, { edges, min_size, max_size })`：`content` 可為任何 `HTMLElement`。初始尺寸為 `min_size`；只有 `edges` 列出的邊能拖曳，拖曳時尺寸夾在上下限內；`set_size` 超出上下限時報錯；`set_collapsed` 隱藏內容與把手，展開後恢復原尺寸。另有純函式 `clamp_size`、`resize_by_edge` |
| `splitter.ts` | `create_splitter(a, b, { axis, min_a, min_b })`：插在相鄰兄弟元素 `a`、`b` 之間；拖曳時兩邊總長不變，各自不小於最小值（以 `flex` 設定尺寸，父元素需為 flex 容器）。純函式 `split` |
| `extensions.ts` | `list_panels(registry)`：依 registry 順序讀各 pack 的 `other_info.basic_ui.panels`；格式錯誤時報錯 |
| `root.ts` | `mount_ui_root(container, target_world)`：建立全頁唯一的根容器，依序掛上所有宣告的 panel；`panels` 為雙層 map（`pack_id` → `name` → panel），元素帶 `data-basic_ui_pack` / `data-basic_ui_name`；同一份 document 已有根容器時報錯；全部建好才放進 `container` |
| `index.ts` | `manifest { pack_id: 'basic_ui' }` 與上述 export |

## 擴充點

下游 pack 在 manifest 宣告：

```ts
provides:
{
    other_info:
    {
        basic_ui:
        {
            panels: { [name]: { render(target_world): HTMLElement; edges; min_size; max_size } }
        }
    }
}
```

- `basic_ui` 命名空間目前只接受 `panels`，其他鍵報錯。
- 擴充點在 registry，compose 後固定，執行期不能取消註冊；不要的 panel 以不啟用該 pack 處理。
- 掛載順序 = registry 順序（`ENABLED_PACKS` 的順序）；位置由 panel 自身的元素與樣式決定。

## Todo

- 樣式之後改用 Tailwind（`vite.config.ts` 尚未啟用 `@tailwindcss/vite`）；目前只有功能所需的 inline style 與 `data-basic_ui_*` 屬性。
- `src/main.ts` 尚未啟用此 pack 或呼叫 `mount_ui_root`。
- CLI 的輸入介面（docket plan 20261015175737）尚未實作。
