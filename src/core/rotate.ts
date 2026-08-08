import type { vector, rotation } from './types'

/**
 * Rotate a local offset vector around the Z axis.
 *
 * Only x and y are affected; z (layer) is preserved as-is.
 *
 * | Rotation | Transform         |
 * |----------|-------------------|
 * | 0  (0°)  | ( x,  y)          |
 * | 1  (90°) | (-y,  x)  CCW     |
 * | 2 (180°) | (-x, -y)          |
 * | 3 (270°) | ( y, -x)  CCW     |
 */
export function rotate_vector(v: vector, r: rotation): vector
{
  switch (r)
  {
    case 0: return {  x: v.x,  y: v.y, z: v.z }
    case 1: return {  x: -v.y, y: v.x, z: v.z }
    case 2: return {  x: -v.x, y: -v.y, z: v.z }
    case 3: return {  x: v.y,  y: -v.x, z: v.z }
  }
}
