import type { vector_3d, rotation_step, d4_transform } from './types';

/**
 * Normalizes an arbitrary integer rotation step into 0 | 1 | 2 | 3 (modulo 4).
 */
export function normalize_rotation(steps: number): rotation_step
{
    const mod = steps % 4;
    return (mod >= 0 ? mod : mod + 4) as rotation_step;
}

/**
 * Applies a 2.5D D4 dihedral group transformation (rotation + optional reflection)
 * to a 3D vector [x, y, z], preserving the layer coordinate z.
 */
export function apply_d4_transform(v: vector_3d, transform: d4_transform): vector_3d
{
    // 1. Apply reflection across X axis (y -> -y) if flipped is true
    const fx = v[0];
    const fy = transform.flipped ? -v[1] : v[1];
    const fz = v[2];

    // 2. Apply orthogonal rotation (0: 0°, 1: 90°, 2: 180°, 3: 270°)
    const rot = normalize_rotation(transform.rotation);
    switch (rot)
    {
        case 0:
        {
            return [fx, fy, fz];
        }

        case 1:
        {
            return [-fy, fx, fz];
        }

        case 2:
        {
            return [-fx, -fy, fz];
        }

        case 3:
        {
            return [fy, -fx, fz];
        }
    }
}

/**
 * Composes two D4 transformations: applying t1 first, then t2.
 */
export function compose_d4(t1: d4_transform, t2: d4_transform): d4_transform
{
    const r1 = normalize_rotation(t1.rotation);
    const r2 = normalize_rotation(t2.rotation);

    if (!t2.flipped)
    {
        return {
            rotation: normalize_rotation(r1 + r2),
            flipped:  t1.flipped
        };
    }
    else
    {
        return {
            rotation: normalize_rotation(r2 - r1),
            flipped:  !t1.flipped
        };
    }
}

/**
 * Computes the inverse of a D4 transformation.
 */
export function invert_d4(t: d4_transform): d4_transform
{
    const r = normalize_rotation(t.rotation);
    if (!t.flipped)
    {
        return {
            rotation: normalize_rotation(4 - r),
            flipped:  false
        };
    }
    else
    {
        return {
            rotation: r,
            flipped:  true
        };
    }
}

/**
 * Validates that a given vector is strictly a 3-element [x, y, z] array.
 */
export function is_vector_3d(v: number[]): v is vector_3d
{
    return Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number' && !isNaN(n));
}

/**
 * Strictly adds two 3D vectors together without implicit zero padding.
 */
export function add_vector_3d(a: vector_3d, b: vector_3d): vector_3d
{
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
