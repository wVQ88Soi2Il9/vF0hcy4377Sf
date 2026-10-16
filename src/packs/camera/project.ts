import * as core from '@/core';
import * as basic_renderer from '@/packs/basic_renderer';

export type camera_view = basic_renderer.projection_view;

function check_view(target: core.space, view: camera_view): void
{
    const dim = target.dimension;
    const [h, v] = view.axes;
    for (const axis of view.axes)
    {
        if (!Number.isInteger(axis) || axis < 0 || axis >= dim)
        {
            throw new Error(`camera axis must be an integer in [0, ${dim}), got ${axis}`);
        }
    }
    if (h === v)
    {
        throw new Error(`camera axes must differ, got ${h},${v}`);
    }
    for (const key of Object.keys(view.slice))
    {
        const axis = Number(key);
        if (!Number.isInteger(axis) || axis < 0 || axis >= dim || axis === h || axis === v)
        {
            throw new Error(`slice axis ${key} is not a non-view axis of a ${dim}-dimensional space`);
        }
    }
    for (let axis = 0; axis < dim; axis++)
    {
        if (axis === h || axis === v)
        {
            continue;
        }
        if (!(axis in view.slice))
        {
            throw new Error(`slice for axis ${axis} is required`);
        }
        const pos = view.slice[axis];
        if (!Number.isInteger(pos) || pos < 0 || pos > target.size[axis])
        {
            throw new Error(`slice for axis ${axis} must be an integer in [0, ${target.size[axis]}], got ${pos}`);
        }
    }
}

// 接觸即傳：裝置任一格碰到切片（含格面）就整個顯示；不裁切，視窗外的格子照樣輸出
export function project(target: core.space, view: camera_view): basic_renderer.projection
{
    check_view(target, view);
    const [h, v] = view.axes;
    const slice_axes = Object.keys(view.slice).map(Number);

    const devices: basic_renderer.projected_device[] = [];
    for (const dev of target.devices.values())
    {
        const anchors = dev.get_shape().map(offset => offset.map((o, i) => o + dev.position[i]));
        const touches = anchors.some(cell =>
            slice_axes.every(axis => cell[axis] <= view.slice[axis] && view.slice[axis] <= cell[axis] + 2));
        if (!touches)
        {
            continue;
        }

        const seen = new Set<string>();
        const cells: [number, number][] = [];
        for (const cell of anchors)
        {
            const x = cell[h];
            const y = cell[v];
            const key = `${x},${y}`;
            if (seen.has(key))
            {
                continue;
            }
            seen.add(key);
            cells.push([x, y]);
        }
        devices.push({ device: dev, cells });
    }
    return { size: [target.size[h], target.size[v]], view: { axes: [h, v], slice: { ...view.slice } }, devices };
}
