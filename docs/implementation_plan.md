# Core（最終）

**Core = 純 TypeScript 型別定義。零外部依賴。全小寫 snake_case + Allman 括號風格。**

---

## 座標系

```
z = layer index（離散整數）
x, y = 層內格座標

world cell = vector { x, y, z }
```

Device 的 cells 是 `vector[]`——自然支援跨層，不需要任何額外包裝。

---

## 型別定義 (`src/core/types.ts`)

```ts
type vector = { x: number; y: number; z: number }

type rotation = 0 | 1 | 2 | 3

interface item
{
  id:       string
  quantity: number
}

interface recipe
{
  id:      string
  inputs:  item[]
  outputs: item[]
}

interface device
{
  id:           string

  // 實例狀態
  start_point:  vector    // 錨點（world 座標，含 z layer）
  rotation:     rotation

  // 設備本體定義（local 座標，relative to start_point，rotation 前）
  positions:    vector[]  // 佔據的格子
  input_ports:  vector[]  // input port 位置
  output_ports: vector[]  // output port 位置
  recipes:      recipe[]

  // Mod 擴充
  other_info:   Record<string, unknown>
}

interface game_map
{
  size:    vector    // 格數上限 { x, y, z }
  devices: device[]
}
```

---

## 檔案結構

```
src/core/
  types.ts      ← vector, rotation, item, recipe, device, game_map
  index.ts      ← public API 入口（僅導出 types）
```
