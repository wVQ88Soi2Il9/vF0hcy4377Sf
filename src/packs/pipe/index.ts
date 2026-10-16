import * as core from '@/core';
import * as vanilla_beta from '@/packs/vanilla_beta';

/**
 * 一段路徑：沿 axis 位移 delta 座標單位（偶數，正負表方向；每格 2 單位）。
 */
export interface pipe_segment
{
    axis:  number;
    delta: number;
}

/**
 * 將連續折點轉為相對位移段；斜向的兩點依軸序拆成多段。
 * Example: [[0,0,0], [4,0,0], [4,2,0]] -> [{ axis: 0, delta: 4 }, { axis: 1, delta: 2 }]
 */
export function shape_to_segments(points: core.vector[]): pipe_segment[]
{
    const segments: pipe_segment[] = [];
    for (let i = 1; i < points.length; i++)
    {
        const prev = points[i - 1];
        const curr = points[i];
        for (let axis = 0; axis < curr.length; axis++)
        {
            const delta = curr[axis] - prev[axis];
            if (delta !== 0)
            {
                segments.push({ axis, delta });
            }
        }
    }
    return segments;
}

/**
 * 依 segments 走出路徑格子的局部座標；起點格為 [0, ...]，每步 ±2。
 */
export function segments_to_shape(dimension: number, segments: pipe_segment[]): core.vector[]
{
    const current: core.vector = new Array(dimension).fill(0);
    const shape: core.vector[] = [[...current]];
    for (const { axis, delta } of segments)
    {
        if (delta % 2 !== 0)
        {
            throw new Error(`Pipe segment delta must be even, got ${delta}.`);
        }
        const step = Math.sign(delta) * 2;
        for (let moved = 0; moved !== delta; moved += step)
        {
            current[axis] += step;
            shape.push([...current]);
        }
    }
    return shape;
}

/**
 * 把「start position + segments」轉為 device。
 * input 埠在起點格沿第一段反方向半格，output 埠在終點格沿最後一段方向半格。
 */
export class pipe_device extends core.device
{
    public readonly segments: pipe_segment[];

    constructor
    (
        device_uid:    core.uid,
        definition_id: core.namespaced_id,
        start:         core.vector,
        segments:      pipe_segment[],
        other_info?:   Record<string, unknown>
    )
    {
        super(device_uid, definition_id, start, other_info);
        this.segments = segments.map(s => ({ ...s }));
    }

    public get_shape(): core.vector[]
    {
        return segments_to_shape(this.position.length, this.segments);
    }

    public get_port(): core.port[]
    {
        const shape = this.get_shape();
        const first = this.segments[0];
        const last = this.segments[this.segments.length - 1];
        const in_offset = [...shape[0]];
        in_offset[first.axis] -= Math.sign(first.delta);
        const out_offset = [...shape[shape.length - 1]];
        out_offset[last.axis] += Math.sign(last.delta);
        return [
            { port_uid: 'in',  offset: in_offset,  direction: 'input' },
            { port_uid: 'out', offset: out_offset, direction: 'output' }
        ];
    }
}

/**
 * in = out：每個 input 埠的 item 原樣送到對應的 output 埠。
 */
export const pass_through_recipe: core.recipe =
{
    namespace: 'pipe',
    id:        'pass_through',
    evaluate(context: vanilla_beta.recipe_context): core.item_stack[]
    {
        return context.inputs.map(s => ({ ...s }));
    }
};

export const manifest: core.pack_manifest =
{
    pack_id:  'pipe',
    provides:
    {
        recipes:
        {
            pass_through: pass_through_recipe
        }
    }
};
