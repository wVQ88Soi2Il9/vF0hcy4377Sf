import type { vector, rotation } from '@/core/types';

/**
 * Adds two vectors together component-wise.
 * Assumes both vectors have the same length.
 */
export function add_vector(a: vector, b: vector): vector
{
    return a.map((v, i) => v + (b[i] ?? 0));
}

/**
 * Applies an N-dimensional rotation to a local offset vector.
 *
 * Each rotation_plane describes a 90° CCW turn in the plane spanned by
 * axis_a and axis_b.  One Givens step in that plane transforms:
 *   v'[axis_a] = -v[axis_b]
 *   v'[axis_b] =  v[axis_a]
 *
 * Planes are applied left-to-right (first element first).
 * An empty rotation array means no rotation.
 */
export function rotate_vector(vec: vector, rot: rotation): vector
{
    const v = vec.slice();   // work on a mutable copy

    for (const plane of rot)
    {
        const { axis_a, axis_b, steps } = plane;

        for (let s = 0; s < steps; s++)
        {
            const a = v[axis_a] ?? 0;
            const b = v[axis_b] ?? 0;
            v[axis_a] = -b;
            v[axis_b] =  a;
        }
    }

    // Convert -0 to 0 (JavaScript sometimes leaves -0 which can be annoying in tests)
    return v.map(c => c === 0 ? 0 : c);
}

/**
 * Checks if two vectors are exactly equal (same length and same values).
 */
export function vectors_equal(a: vector, b: vector): boolean
{
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Converts a vector to a string for use as a Map or Set key.
 */
export function vector_to_string(vec: vector): string
{
    return vec.join(',');
}

