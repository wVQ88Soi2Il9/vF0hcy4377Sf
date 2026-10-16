# cuboid_device

## 目的

提供長方體裝置的抽象基底類別。下游裝置只需指定 `device_size`，形狀（`get_shape`）由基底類別依 2× 網格產生。

## Code

| 內容 | 說明 |
|---|---|
| `cuboid_to_shape(device_size)` | 依各維度跨度，以步長 2 產生所有單元格的局部座標 |
| `base_cuboid_device` | `core.device` 的抽象子類別；子類別提供 `device_size`；`get_shape()` 呼叫 `cuboid_to_shape` |
| `manifest` | `{ pack_id: 'cuboid_device' }` |

整個 pack 只有 `index.ts` 一個檔案。`get_port()` 仍是 `core.device` 的抽象方法，這裡沒有實作，由下游裝置提供。

## Todo

以下是現況觀察與未決事項，未修改。

- `cuboid_to_shape` 不檢查 `device_size`：跨度為奇數（例如 3）時只會產生 offset 0、2；跨度為 0 或負數時得到空 shape。是否需要校驗未決。
- 目前只有 `test_ui` 的示範裝置繼承 `base_cuboid_device`。
- 連接埠座標與 shape 的對應（半格規則）沒有在此 pack 驗證。
- `src/main.ts` 的 `ENABLED_PACKS` 沒有列入此 pack（它沒有 provides，只被 import 使用）。
