# camera

## 目的

從 N 維空間取出一個 2D 視圖，產生 `basic_renderer.projection`（依賴方向 `camera → basic_renderer`）。繪製由使用端呼叫 `basic_renderer.render`。

## Code

| 檔案 | 內容 |
|---|---|
| `project.ts` | `camera_view`、`project` |
| `state.ts` | `camera_state`、`pan`、`zoom_at`、`fit`、`window_of` |
| `index.ts` | `manifest { pack_id: 'camera' }` 與上述公開 API |

## camera_view

```ts
interface camera_view { axes: [number, number]; slice: Record<number, number>; }
```

- `axes`：畫面水平、垂直方向對應的空間軸，兩軸不同且在維度內。
- `slice`：其餘每個軸都必填一個切片位置，整數且在 `[0, size]`；偶數為格面，奇數為格中心。畫面軸不可出現在 `slice`。
- 不合法時 throw。

## project

`project(space, view): basic_renderer.projection`

- `size = [space.size[h], space.size[v]]`；`view` 為這次投影的畫面軸與切片（複本），供裝置的 `draw` 使用。
- 可見規則「接觸即傳」：裝置任一格在每個切片軸上滿足 `anchor ≤ slice ≤ anchor + 2`（含格面）就整個顯示，切片軸方向不裁切。
- 不裁切：視窗外的格子照樣輸出，裁切由使用端（UI 層）負責。
- `cells` 為裝置各格錨點投影到兩個畫面軸後去重，順序同 `get_shape()`。

## camera_state（無限畫布）

```ts
interface camera_state { view: camera_view; origin: [number, number]; scale: number; }
```

- `origin`：畫面左上角對應的空間座標（兩個畫面軸）；`scale`：一個空間單位畫成幾 px。
- 由使用端保存（camera 不放全域或 world 狀態）；以下函式都回傳新的 state，不改舊的：
  - `pan(state, dx_px, dy_px)`：畫面內容跟著游標移動。
  - `zoom_at(state, factor, [px, py])`：以游標為中心縮放，游標下的空間點不動。
  - `fit(state, space, [w_px, h_px])`：整個空間（兩個畫面軸）置中塞進畫面。
  - `window_of(state, [w_px, h_px])`：畫面看到的空間範圍 `[x, y, w, h]`，可超出空間。
- 不合法的 px 大小、縮放倍率或平移量時 throw。

## Todo

- camera CLI（`d<n>=<val>`）未實作。
