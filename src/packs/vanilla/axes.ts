/**
 * Human 1-indexed string → Internal Code (0-indexed).
 * Strict input format: "d1", "d2", "d3", ... (e.g. "d1" -> 0, "d2" -> 1)
 */
export function parse_axis_name(name: string): number | null
{
    const lower = name.trim().toLowerCase();
    if (lower.startsWith('d'))
    {
        const human_idx = parseInt(lower.substring(1), 10);
        if (!isNaN(human_idx) && human_idx >= 1)
        {
            return human_idx - 1;
        }
    }
    return null;
}

/**
 * Internal Code (0-indexed) → Human 1-indexed string (e.g. 0 -> "d1", 1 -> "d2").
 * Mathematical inverse of parse_axis_name.
 */
export function format_axis_name(internal_idx: number): string
{
    if (!Number.isInteger(internal_idx) || internal_idx < 0)
    {
        throw new Error(`Invalid internal axis index: ${internal_idx}. Must be non-negative integer.`);
    }
    return `d${internal_idx + 1}`;
}

/**
 * Alias for format_axis_name.
 */
export const get_axis_label = format_axis_name;

/**
 * Calculates (dim_h, dim_v) for 2D view projection in N dimensions
 * guaranteeing a Right-Oriented (正定向/右手性, det > 0) coordinate system.
 * Returns null if remaining free dimensions count is not exactly 2.
 */
export function get_right_oriented_axes
(
    num_dims:   number,
    fixed_axes: Set<number>
): { dim_h: number; dim_v: number } | null
{
    const all_axes = Array.from({ length: num_dims }, (_, i) => i);
    const remaining = all_axes.filter(a => !fixed_axes.has(a));

    if (remaining.length !== 2)
    {
        return null;
    }

    const a = remaining[0];
    const b = remaining[1];

    const other_axes = all_axes.filter(x => x !== a && x !== b);
    const candidate_perm = [a, b, ...other_axes];

    let inversions = 0;
    for (let i = 0; i < candidate_perm.length; i++)
    {
        for (let j = i + 1; j < candidate_perm.length; j++)
        {
            if (candidate_perm[i] > candidate_perm[j])
            {
                inversions++;
            }
        }
    }

    if (inversions % 2 === 0)
    {
        return { dim_h: a, dim_v: b };
    }
    else
    {
        return { dim_h: b, dim_v: a };
    }
}
