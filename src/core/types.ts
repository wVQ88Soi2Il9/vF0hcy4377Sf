/**
 * 3D integer grid coordinate vector.
 * x, y = horizontal axes; z = layer index (discrete).
 * All positions within device are local offsets relative to `start_point`.
 */
export type vector = { x: number; y: number; z: number }

/**
 * Rotation around the Z axis (within the XY plane).
 * 0 = 0° | 1 = 90° CCW | 2 = 180° | 3 = 270° CCW
 * z is never affected by rotation.
 */
export type rotation = 0 | 1 | 2 | 3

// ── Recipe ───────────────────────────────────────────────────────────────────

export interface item
{
  id:       string
  quantity: number
}

export interface recipe
{
  id:      string
  inputs:  item[]
  outputs: item[]
}

// ── Device ───────────────────────────────────────────────────────────────────

export interface device
{
  id:           string

  /** Anchor cell in world coordinates (includes layer z). */
  start_point:  vector

  /** Rotation applied to all local offset vectors before adding start_point. */
  rotation:     rotation

  /**
   * Cells this device occupies, as local offsets from start_point (before rotation).
   * e.g. [{ x:0, y:0, z:0 }, { x:1, y:0, z:0 }] = 1×2 horizontal device.
   */
  positions:    vector[]

  /**
   * Input port positions, local offsets (before rotation).
   * A port sits on the boundary adjacent to the device cell.
   * e.g. { x:-1, y:0, z:0 } = left face of the anchor cell.
   */
  input_ports:  vector[]

  /** Output port positions, local offsets (before rotation). */
  output_ports: vector[]

  /** All recipes this device can run. Empty = no recipe needed. */
  recipes:      recipe[]

  /** Mod-extensible metadata. Core never reads or writes this. */
  other_info:   Record<string, unknown>
}

// ── Map ──────────────────────────────────────────────────────────────────────

export interface game_map
{
  /** Grid dimensions: valid cells are 0 ≤ x < size.x, 0 ≤ y < size.y, 0 ≤ z < size.z */
  size:    vector
  devices: device[]
}
