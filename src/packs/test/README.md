# test

## 目的

測試用的 device 與 recipe。只供 `tests/` 使用，不啟用於 `src/main.ts` 的 `ENABLED_PACKS`。

## Code

| 內容 | 說明 |
|---|---|
| `iron`、`coal` | `{ test:iron, quantity: 3 }`、`{ test:coal, quantity: 3 }` |
| `port_device` | `core.device` 子類別；shape 為 `[[0, 0]]`，`ports` 由測試直接指定 |
| `emit_iron` | `test:emit_iron`；輸出 `[iron]` |
| `emit_two` | `test:emit_two`；輸出 `[iron, iron]` |
| `emit_coal` | `test:emit_coal`；輸出 `[coal]` |
| `pass_through` | `test:pass_through`；輸出 = `context.inputs`（`vanilla_gamma.recipe_context`） |
| `iron_pipe` | `test:iron_pipe`；只收鐵，`min(x, 2)`；item 不符時輸出 null item |
| `sink` | `test:sink`；沒有 output |
| `merge_two` | `test:merge_two`；2 個 input，輸出 `min(a + b, 2)`；預設規則 `proportional` |
| `manifest` | `{ pack_id: 'test', provides: { recipes } }` |
