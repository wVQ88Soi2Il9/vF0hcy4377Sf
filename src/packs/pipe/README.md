# pipe

## 目的

把「start position + segments」格式轉為 device：1 個 input 埠、1 個 output 埠，配方為 in = out。pipe 本身不是註冊在 registry 的 device 種類，只提供轉換用的 class。

## 格式

| 項目 | 規則 |
|---|---|
| start | device 的 `position`（anchor） |
| segment | `{ axis, delta }`；沿 `axis` 位移 `delta` 座標單位，必須為偶數（每格 2 單位），正負表方向 |
| points | 連續折點，可用 `shape_to_segments` 轉為 segments |
| 截面 | 1 格 |
| 格數 | `1 + Σ abs(delta) / 2` |

## Code

| 內容 | 說明 |
|---|---|
| `pipe_segment` | `{ axis: number; delta: number }` |
| `shape_to_segments(points)` | 折點轉相對位移段；`delta = 0` 的軸略過，斜向兩點依軸序拆成多段 |
| `segments_to_shape(dimension, segments)` | 起點格 `[0, ...]`，沿每段每步 ±2，回傳路徑所有格子的局部座標；`delta` 為奇數時報錯 |
| `pipe_device` | `core.device` 子類別；constructor 為 `(device_uid, definition_id, start, segments, other_info?)`，不符合 `device_constructor`，不放進 `provides.devices` |
| `get_port()` | `in`（input）：起點格沿第一段反方向退 1；`out`（output）：終點格沿最後一段方向進 1 |
| `pass_through_recipe` | `pipe:pass_through`，in = out：`context.inputs` 原樣作為輸出 |
| `manifest` | `{ pack_id: 'pipe' }`，`provides.recipes.pass_through` |

## Todo

- 路徑自我交疊、空 segments 暫不處理。
- `src/main.ts` 的 `ENABLED_PACKS` 沒有啟用此 pack；CLI / `create_device` template 無法建立 pipe。
