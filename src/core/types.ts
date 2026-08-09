/**
 * 3D integer grid coordinate vector.
 * x, y = horizontal axes; z = layer index (discrete).
 * All positions within device are local offsets relative to `position`.
 */
export type vector = { x: number; y: number; z: number }

/**
 * 3D Discrete Rotation in 90-degree steps (0=0°, 1=90°, 2=180°, 3=270°).
 * Representing rotation around the respective axes.
 */
export type rotation = 
{
  x: 0 | 1 | 2 | 3
  y: 0 | 1 | 2 | 3
  z: 0 | 1 | 2 | 3
}

// ── Pack ─────────────────────────────────────────────────────────────────────

/** 
 * 代表一個從 JSON 載入的資料包 (Mod / Base Game)
 */
export interface pack
{
  id:                  string
  items:               item_definition[]
  recipes:             recipe[]
  device_definitions:  device_definition[]
}

// ── Item ─────────────────────────────────────────────────────────────────────

export interface item_definition
{
  id:          string
  other_info:  Record<string, unknown>
}

export interface item_stack
{
  item_id:   string
  quantity:  number
}

export interface power_stack
{
  power_id:  string
  amount:    number
}

// ── Recipe ───────────────────────────────────────────────────────────────────

export interface recipe
{
  id:       string
  duration: number
  inputs:   item_stack[]
  outputs:  item_stack[]

  /** Requires or generates power during recipe processing. Positive amount = generates, Negative amount = consumes. */
  power?:   power_stack[]
}

// ── Device ───────────────────────────────────────────────────────────────────

// ── Device Definition (靜態藍圖 / 原型) ───────────────────────────────────

export interface device_definition
{
  /** Unique identifier for the device type, e.g. "assembler_mk1" */
  id:           string

  /**
   * Cells this device occupies, as local offsets from anchor (before rotation).
   * e.g. [{ x:0, y:0, z:0 }, { x:1, y:0, z:0 }] = 1×2 horizontal device.
   */
  shape:    vector[]

  /**
   * Input port positions, local offsets (before rotation).
   * A port is defined as the coordinate of the ADJACENT cell it connects to.
   * Example: If device is at (0,0), a right-facing port is at (1,0), an up-facing port is at (0,1).
   */
  input_ports:  vector[]

  /** 
   * Output port positions, local offsets (before rotation). 
   * Defined as the coordinate of the ADJACENT cell.
   */
  output_ports: vector[]

  /** All recipes this device can run. Empty = no recipe needed. */
  recipe_ids:   string[]
}

// ── Device Instance (動態實體) ─────────────────────────────────────────

export interface device
{
  /** Unique numerical identifier for this specific placed instance on the map */
  unique_id:            number

  /** Reference to device_definition.id */
  definition_id:        string

  /** Anchor cell in world coordinates (includes layer z). */
  position:             vector

  /** Rotation applied to all local offset vectors before adding position. */
  rotation:             rotation

  /** The recipe currently selected by the player to be processed by this device */
  selected_recipe_id?:  string

  /** Mod-extensible dynamic metadata (e.g. inventory, working status, progress). Core never reads this. */
  other_info:           Record<string, unknown>
}

// ── Map ──────────────────────────────────────────────────────────────────────

export interface game_map
{
  /** Grid dimensions: valid cells are 0 ≤ x < size.x, 0 ≤ y < size.y, 0 ≤ z < size.z */
  size:            vector

  /** Auto-increment counter for device unique_id generation */
  next_unique_id:  number

  devices:         device[]
}

// ── Validation & Graph ───────────────────────────────────────────────────────

export interface map_validation_result
{
  out_of_bounds: number[]
  overlapped:    number[]
}

export interface device_node
{
  unique_id:      number
  previous_nodes: number[]
  next_nodes:     number[]
}

