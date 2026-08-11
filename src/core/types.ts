/**
 * N-dimensional integer grid coordinate vector.
 * Index 0 = X, 1 = Y, 2 = Z, 3 = W, ...
 * All positions within a device are local offsets relative to `position`.
 */
export type vector = number[]

/**
 * A single 90-degree rotation step in the plane spanned by axis_a and axis_b.
 * steps: number of 90° CCW turns (0–3).
 *
 * In 3D this maps to the familiar axis rotations:
 *   axis_a=1, axis_b=2  →  rotate around X
 *   axis_a=0, axis_b=2  →  rotate around Y (CCW looking down +Y)
 *   axis_a=0, axis_b=1  →  rotate around Z
 */
export type rotation_plane =
{
    axis_a: number
    axis_b: number
    steps:  0 | 1 | 2 | 3
}

/**
 * N-dimensional rotation expressed as an ordered list of plane rotations.
 * Applied left-to-right. An empty array means no rotation.
 */
export type rotation = rotation_plane[]

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
     * e.g. [[0,0,0], [2,0,0]] = 1×2 horizontal device in 3D half-grid coords.
     */
    shape:        vector[]

    /**
     * Input port positions, local offsets (before rotation).
     * A port is defined as the coordinate of the ADJACENT cell it connects to.
     * Example: If device is at [0,0], a right-facing port is at [1,0].
     */
    input_ports:  vector[]

    /** 
     * Output port positions, local offsets (before rotation). 
     * Defined as the coordinate of the ADJACENT cell.
     */
    output_ports: vector[]

    /** All recipes this device can run. Empty = no recipe needed. */
    recipe_ids:   string[]

    /** Mod-extensible static metadata for the device blueprint. Core never reads this. */
    other_info:   Record<string, unknown>
}

// ── Device Instance (動態實體) ─────────────────────────────────────────

export interface device
{
    /** Unique numerical identifier for this specific placed instance on the map */
    unique_id:            number

    /** Reference to device_definition.id */
    definition_id:        string

    /** Anchor cell in world coordinates (N-dimensional). */
    position:             vector

    /** Ordered list of plane rotations applied to all local offset vectors before adding position. */
    rotation:             rotation

    /** The recipe currently selected by the player to be processed by this device */
    selected_recipe_id?:  string

    /** Mod-extensible dynamic metadata (e.g. inventory, working status, progress). Core never reads this. */
    other_info?:           Record<string, unknown>
}

// ── Map ──────────────────────────────────────────────────────────────────────

export interface game_map
{
    /**
     * Grid dimensions per axis.
     * Length of this array defines N (the number of spatial dimensions).
     * Valid cells satisfy: 0 <= pos[i] < size[i] for all i.
     */
    size:            vector

    /** Auto-increment counter for device unique_id generation */
    unique_id:       number

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
