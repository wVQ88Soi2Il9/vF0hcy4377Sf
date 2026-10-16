# test

## 目的

測試用的 device。只供 `tests/` 使用，不啟用於 `src/main.ts` 的 `ENABLED_PACKS`。

## Code

| 內容 | 說明 |
|---|---|
| `port_device` | `core.device` 子類別；shape 為 `[[0, 0]]`，`ports` 由測試直接指定 |
| `manifest` | `{ pack_id: 'test' }` |
