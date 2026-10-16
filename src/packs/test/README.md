# test

## 目的

測試用的 device 與 recipe。只供 `tests/` 使用，不啟用於 `src/main.ts` 的 `ENABLED_PACKS`。

## Code

| 內容 | 說明 |
|---|---|
| `iron` | `{ test:iron, quantity: 3 }` |
| `port_device` | `core.device` 子類別；shape 為 `[[0, 0]]`，`ports` 由測試直接指定 |
| `emit_iron` | `test:emit_iron`；輸出 `[iron]` |
| `emit_two` | `test:emit_two`；輸出 `[iron, iron]` |
| `pass_through` | `test:pass_through`；輸出 = `context.inputs`（`vanilla_gamma.recipe_context`） |
| `manifest` | `{ pack_id: 'test', provides: { recipes } }` |
