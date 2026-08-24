import { device, type vector, type namespaced_id } from '@/API';

export interface pipe_segment
{
    axis:  number; // 0 for X/D1, 1 for Y/D2, 2 for Z/D3...
    delta: number;
}

/**
 * 將連續折點 (Waypoints) 轉為相對位移段 (Segments)。
 * Example: [[0,0,0], [4,0,0], [4,2,0]] -> [{ axis: 0, delta: 4 }, { axis: 1, delta: 2 }]
 */
export function points_to_segments(points: vector[]): pipe_segment[]
{
    if (points.length <= 1)
    {
        return [];
    }

    const segments: pipe_segment[] = [];
    let prev = points[0];

    for (let i = 1; i < points.length; i++)
    {
        const curr = points[i];
        for (let j = 0; j < curr.length; j++)
        {
            const delta = curr[j] - prev[j];
            if (delta !== 0)
            {
                segments.push({ axis: j, delta });
            }
        }
        prev = curr;
    }

    return segments;
}

/**
 * 依據 segments 展開所佔據的 2x Grid 本地格點座標。
 */
export function segments_to_shape(dim_count: number, segments: pipe_segment[]): vector[]
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

    for (const seg of segments)
    {
        const step = seg.delta > 0 ? 2 : -2;
        const count = Math.abs(seg.delta) / 2;
        for (let s = 0; s < count; s++)
        {
            curr[seg.axis] += step;
            add_cell(curr);
        }
    }

    return cells;
}

/**
 * Abstract class for pipe device category.
 */
export abstract class pipe extends device
{
    public segments: pipe_segment[];

    constructor
    (
        uid:           number,
        definition_id: namespaced_id,
        position:      vector,
        other_info?:   Record<string, unknown>
    )
    {
        super(uid, definition_id, position);

        if (other_info && Array.isArray(other_info.points))
        {
            this.segments = points_to_segments(other_info.points as vector[]);
        }
        else if (other_info && Array.isArray(other_info.segments))
        {
            this.segments = (other_info.segments as pipe_segment[]).map(s => ({ ...s }));
        }
        else
        {
            this.segments = [];
        }
    }

    public get_shape(): vector[]
    {
        return segments_to_shape(this.position.length, this.segments);
    }
}
