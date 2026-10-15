# basic_renderer — 功能草稿

為 cleanroom design 而留:只描述原實作「做了什麼」,不保留程式碼。原實作已刪除;需要原始碼時看 git 歷史(刪除前最後一版:`4ad764d`)。

## 定位

把一份 2D 投影資料(`projection`)畫成 DOM 元素。不知道空間的維度,也不做投影;投影由 `camera` 產生。

pack id:`basic_renderer`,manifest 只有 `pack_id`,沒有 hooks、state、commands。

## 輸入資料

- `projection`
  - `size`:2D 尺寸(格數),`[寬, 高]`
  - `devices`:要畫的裝置清單
  - `other_info`:附帶資訊,renderer 不讀
- `render_options`(全部可選)
  - `cell_size`:一格裝置單元的像素邊長
  - `show_grid`:是否畫背景格線
  - `show_ports`:是否畫埠
  - `show_labels`:是否畫裝置標籤
- `drawable_device`:實作 `draw(options) -> HTMLElement` 的裝置

## 功能

### 1. 視口(`render(proj, options)`)

- 座標單位:1 個座標單位 = `cell_size / 2` 像素;一個裝置單元佔 2×2 座標單位,也就是 `cell_size` 像素見方。
- 產生一個固定大小的根元素,大小為 `size × 單位像素`,深色背景,超出部分裁切。
- `show_grid` 開啟時,畫一層不攔截滑鼠的格線,格距 = `cell_size`。
- 裝置層疊在格線上,鋪滿視口。

### 2. 裝置繪製(多型)

對 `projection.devices` 的每個裝置:

1. 裝置有 `draw` 函式而且回傳 HTMLElement:使用它,並只補上它沒設定的絕對定位與 left/top(依裝置位置換算)。
2. 否則:使用預設繪製(功能 3)。

符合 AGENTS.md:「裝置專屬繪製留在裝置能力上,renderer 以多型呼叫」。

### 3. 預設裝置繪製(`render_fallback_device(dev, options)`)

- 容器絕對定位在裝置位置,可接收滑鼠事件。
- **形狀**:`dev.get_shape()` 的每個單元畫一個方塊,邊長 `cell_size`。
- **標籤**(`show_labels`):疊在第一個單元上;文字是定義 id 前 4 個字元;滑鼠提示 `namespace:id (#device_uid)`;不可選取。
- **埠**(`show_ports`):`dev.get_port()` 的每個埠在其 offset 畫一個小圓點,依方向分三色(input / output / 其他=雙向),滑鼠提示 `Port #uid (方向)`。
- 元素帶 class:`device_fallback`、`device_cell`、`device_label`、`device_port port_<direction>`;視口與裝置層是 `basic_renderer_viewport`、`basic_renderer_devices`。
