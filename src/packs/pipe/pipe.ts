import { device, type vector } from '@/API';

export interface pipe_segment
{
    direction: number; // 0-indexed axis dimension (e.g. 0 for d1/x, 1 for d2/y, 2 for d3/z)
    offset:    number; // distance offset along the direction (excluding turning corner overlap)
}

export interface pipe_segment_human
{
    direction: string; // human label e.g. "d1", "d2", "x", "y"
    offset:    number;
}

/**
 * Converts a sequence of discrete waypoint coordinates into segments.
 * Corners/turns are not duplicated or double-counted in segment offsets.
 * Example:
 *   [[0,0], [2,0], [4,0], [6,0], [6,2]]
 *   -> segments: [{ direction: 0, offset: 4 }, { direction: 1, offset: 2 }]
 */
export function waypoints_to_segments
(
    waypoints: vector[]
): pipe_segment[]
{
    if (waypoints.length <= 1)
    {
        return [];
    }

    // 1. Group consecutive waypoints by straight-line direction
    const raw_legs: { direction: number; count: number; sign: number }[] = [];

    let current_pos = [...waypoints[0]];

    for (let i = 1; i < waypoints.length; i++)
    {
        const next_pos = waypoints[i];

        let diff_dim = -1;
        let diff_val = 0;

        for (let d = 0; d < next_pos.length; d++)
        {
            const diff = next_pos[d] - current_pos[d];
            if (diff !== 0)
            {
                diff_dim = d;
                diff_val = diff;
                break;
            }
        }

        if (diff_dim !== -1)
        {
            const sign = diff_val > 0 ? 1 : -1;
            const last_leg = raw_legs[raw_legs.length - 1];

            if (last_leg && last_leg.direction === diff_dim && last_leg.sign === sign)
            {
                last_leg.count += 1;
            }
            else
            {
                raw_legs.push
                ({
                    direction: diff_dim,
                    count:     1,
                    sign:      sign
                });
            }
            current_pos = [...next_pos];
        }
    }

    // 2. Compute offsets without double counting turn corners.
    // For a leg that connects to a subsequent turn, the turning corner cell
    // is attributed to the following leg (or turn anchor), reducing this leg's span by 1 cell (offset - 2).
    const segments: pipe_segment[] = [];

    for (let i = 0; i < raw_legs.length; i++)
    {
        const leg = raw_legs[i];
        const has_next = i < raw_legs.length - 1;
        const cell_steps = has_next ? Math.max(0, leg.count - 1) : leg.count;

        segments.push
        ({
            direction: leg.direction,
            offset:    cell_steps * 2 * leg.sign
        });
    }

    return segments;
}

/**
 * Generates all 2x Grid discrete local cell anchor positions along the pipe path (starting from [0, 0, ...]).
 * Reconstructs the exact path cells without duplicate corners.
 */
export function segments_to_shape
(
    dim_count: number,
    segments:  pipe_segment[]
): vector[]
{
    const cells: vector[] = [];
    const visited = new Set<string>();

    function add_cell(p: vector): void
    {
        const key = p.join(',');
        if (!visited.has(key))
        {
            visited.add(key);
            cells.push([...p]);
        }
    }

    let curr = new Array(dim_count).fill(0);
    add_cell(curr);

    for (let i = 0; i < segments.length; i++)
    {
        const seg = segments[i];
        const step = seg.offset > 0 ? 2 : -2;
        const count = Math.abs(seg.offset) / 2;

        for (let s = 0; s < count; s++)
        {
            curr[seg.direction] += step;
            add_cell(curr);
        }

        // If transitioning to the next segment, move 1 step into the corner anchor
        if (i < segments.length - 1)
        {
            const next_step = seg.offset >= 0 ? 2 : -2;
            curr[seg.direction] += next_step;
            add_cell(curr);
        }
    }

    return cells;
}

/**
 * Abstract base class for pipe device category.
 * Holds pipe geometric attributes via device.position + segments [{direction, offset}, ...].
 * Segments do not include turning corner overlap.
 */
export abstract class pipe extends device
{
    public segments: pipe_segment[];

    constructor
    (
        uid:           number,
        definition_id: string,
        position:      vector,
        segments?:     pipe_segment[]
    )
    {
        super(uid, definition_id, position);
        this.segments = segments ? segments.map(s => ({ ...s })) : [];
    }

    public get_shape(): vector[]
    {
        return segments_to_shape(this.position.length, this.segments);
    }
}
