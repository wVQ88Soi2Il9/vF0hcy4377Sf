# Core（最終）

**Core = 純 TypeScript，零外部依賴。全小寫 snake_case + Allman 括號風格。**

---

## 座標系

```
z = layer index（離散整數）
x, y = 層內格座標

world cell = vector { x, y, z }
```

Device 的 cells 是 `vector[]`——自然支援跨層，不需要任何額外包裝。

---

## 型別定義

```ts
// types.ts

type vector = { x: number; y: number; z: number }

/**
 * 旋轉：繞 Z 軸（在 XY 平面內）
 * 0 = 0°  /  1 = 90°  /  2 = 180°  /  3 = 270°
 */
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

## 純函式

```ts
// rotate.ts
function rotate_vector(v: vector, r: rotation): vector
// 只旋轉 x, y；z（layer）不動

// geometry.ts
function get_world_cells(d: device): vector[]
function get_world_input_ports(d: device): vector[]
function get_world_output_ports(d: device): vector[]

// map.ts
function is_cell_occupied(map: game_map, cell: vector): boolean
function place_device(map: game_map, d: device): boolean   // 衝突回傳 false
function remove_device(map: game_map, id: string): boolean
function get_device_at(map: game_map, cell: vector): device | null
```

---

## 跨層範例

```ts
// 一個直立設備，佔 z=0 和 z=1 兩層
const pipe: device =
{
  id: 'pipe-1',
  start_point:  { x: 3, y: 2, z: 0 },
  rotation:     0,
  positions:    [{ x:0, y:0, z:0 }, { x:0, y:0, z:1 }],  // 垂直兩格
  input_ports:  [{ x:0, y:0, z:-1 }],  // 下方入口
  output_ports: [{ x:0, y:0, z:2 }],   // 上方出口
  recipes:      [],
  other_info:   {},
}
```

---

## 檔案

```
src/core/
  types.ts      ← vector, rotation, item, recipe, device, game_map
  rotate.ts     ← rotate_vector()
  geometry.ts   ← get_world_cells / ports
  map.ts        ← is_cell_occupied, place_device, remove_device, get_device_at
  index.ts      ← public API 入口
```

**不屬於 Core（留給 mod / app layer）：**  
Device 類型 registry、連線 Edge、渲染、Undo/Redo、序列化、UI 狀態。
