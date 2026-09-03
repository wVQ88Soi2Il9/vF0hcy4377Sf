import type { vector } from '@/core';

/**
 * Adds two vectors together component-wise.
 * Assumes both vectors have the same length.
 */
export function add_vector(a: vector, b: vector): vector
{
    return a.map((v, i) => v + b[i]);
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
