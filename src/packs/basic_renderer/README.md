# basic_renderer

## 目的

把一份 2D 投影畫成 SVG。不做投影，也不知道空間有幾維；投影由 `camera` 產生（依賴方向 `camera → basic_renderer`，本 pack 不 import camera）。

## Code

| 檔案 | 內容 |
|---|---|
| `render.ts` | `projection`、`projected_device`、`drawable` mixin、`is_drawable`、`render` |
| `index.ts` | `manifest { pack_id: 'basic_renderer' }` 與上述公開 API |

## 投影

```ts
interface projected_device { device: core.device; cells: [number, number][]; }
interface projection_view  { axes: [number, number]; slice: Record<number, number>; }
interface projection       { size: [number, number]; view: projection_view; devices: projected_device[]; }
```

- 座標單位同空間（一格 = 2），原點為空間原點；`cells` 不保證在 `size` 內，裁切由呼叫端負責。
- `size` 為空間在兩個畫面軸的大小；render 只用它的高做垂直翻轉，也供呼叫端標示空間範圍。
- `view` 為投影時的視角（畫面軸與切片），render 不解讀，原樣傳給每個裝置的 `draw`，供裝置自行投影埠等 N 維資訊。

## 裝置畫法

繪製能力以 mixin 套到裝置類別上（AGENTS.md 5.2 的 capability，不佔 is-a 繼承鏈）：

```ts
class conveyor extends basic_renderer.drawable(cuboid_device.base_cuboid_device)
{
    public draw(item: basic_renderer.projected_device, cell_px: number, view: basic_renderer.projection_view): SVGElement { ... }
}
```

- 建構子與 `other_info` 照原本繼承；`draw` 為 abstract，漏寫時編譯報錯。
- 每次呼叫 `drawable(base)` 產生新類別，不能用 `instanceof` 判斷；改用 `is_drawable(device)`（brand symbol）。

## render

`render(view, cell_px): SVGGElement`

- 回傳一個圖層 `<g>`，座標為空間座標 × `cell_px / 2`；不設寬高或 `viewBox`。
- 垂直軸向上（human 選定）：圖層帶 `transform="translate(0 H) scale(1 -1)"`（`H = size[1] / 2 × cell_px`），第二軸 0 在空間範圍底部。裝置的 `draw` 照向下為正的座標畫，不必自行翻轉；文字會跟著上下顛倒。看哪一塊（無限畫布的平移/縮放）由呼叫端的 `<svg viewBox>` 決定。
- `cell_px`（一格的 render 單位）必填，非有限正數時 throw。
- 依 `view.devices` 順序，只畫 `is_drawable` 的裝置，以 `draw(item, cell_px, view.view)` 的回傳值 append 進圖層；其他裝置略過。

## Todo

- 沒有預設畫法、背景格線、標籤或埠的繪製；由各裝置的 `draw` 自行處理（埠由裝置依 `view` 自行投影，human 選定）。
