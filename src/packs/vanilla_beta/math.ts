import * as core from '@/core';

/**
 * Adds two vectors together component-wise.
 * Assumes both vectors have the same length.
 */
export function add_vector(a: core.vector, b: core.vector): core.vector
{
    return a.map((v, i) => v + b[i]);
}

/**
 * Checks if two vectors are exactly equal (same length and same values).
 */
export function vectors_equal(a: core.vector, b: core.vector): boolean
{
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Converts a vector to a string for use as a Map or Set key.
 */
export function vector_to_string(vec: core.vector): string
{
    return vec.join(',');
}
