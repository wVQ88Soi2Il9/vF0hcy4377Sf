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
  unique_id:          number    // 放置在地圖上的實體唯一數值 ID

  definition_id:      string    // 引用原型藍圖 ID
  start_point:        vector    // 錨點（world 座標，含 z layer）
  rotation:           rotation
  selected_recipe_id?: string

  // Mod 擴充
  other_info:         Record<string, unknown>
}

interface game_map
{
  size:            vector    // 格數上限 { x, y, z }
  next_unique_id:  number    // 自增 ID 計數器
  devices:         device[]
}
```

---

## 檔案結構

```
src/core/
  types.ts      ← vector, rotation, item, recipe, device, game_map
  index.ts      ← public API 入口（僅導出 types）
```
