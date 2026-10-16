import { describe, it, expect } from 'vitest';
import * as core from '@/core';
import * as camera from '@/packs/camera';
import * as cuboid_device from '@/packs/cuboid_device';

const def: core.namespaced_id = { namespace: 'test', id: 'box' };

function box(uid_char: string, position: core.vector, size: core.vector): cuboid_device.base_cuboid_device
{
    class box_device extends cuboid_device.base_cuboid_device
    {
        public readonly device_size: core.vector = size;
        public get_port(): core.port[] { return []; }
    }
    return new box_device(uid_char.repeat(16), def, position);
}

function make_space(...devices: core.device[]): core.space
{
    const target = new core.space([8, 8, 4]);
    for (const dev of devices)
    {
        target.devices.set(dev.device_uid, dev);
    }
    return target;
}

function uids(view: ReturnType<typeof camera.project>): string[]
{
    return view.devices.map(item => item.device.device_uid[0]);
}

describe('camera.project', () =>
{
    it('selects axes and projects every cell of a touching device', () =>
    {
        const a = box('a', [0, 0, 0], [4, 2, 4]);
        const view = camera.project(make_space(a), { axes: [0, 2], slice: { 1: 1 } });
        expect(view.size).toEqual([8, 4]);
        expect(view.view).toEqual({ axes: [0, 2], slice: { 1: 1 } });
        expect(view.devices[0].cells).toEqual([[0, 0], [0, 2], [2, 0], [2, 2]]);
    });

    it('touch rule: a cell center hits one layer, a face hits both sides', () =>
    {
        const low = box('a', [0, 0, 0], [2, 2, 2]);
        const high = box('b', [2, 2, 2], [2, 2, 2]);
        const target = make_space(low, high);
        expect(uids(camera.project(target, { axes: [0, 1], slice: { 2: 1 } }))).toEqual(['a']);
        expect(uids(camera.project(target, { axes: [0, 1], slice: { 2: 2 } }))).toEqual(['a', 'b']);
        expect(uids(camera.project(target, { axes: [0, 1], slice: { 2: 3 } }))).toEqual(['b']);
    });

    it('shows the whole device on the slice axes and dedupes projected cells', () =>
    {
        const tall = box('a', [0, 0, 0], [2, 2, 4]);
        const view = camera.project(make_space(tall), { axes: [0, 1], slice: { 2: 1 } });
        expect(view.devices[0].cells).toEqual([[0, 0]]);
    });

    it('does not clip cells outside the view', () =>
    {
        const edge = box('a', [6, 0, 0], [4, 2, 2]);
        const outside = box('b', [8, 0, 0], [2, 2, 2]);
        const view = camera.project(make_space(edge, outside), { axes: [0, 1], slice: { 2: 1 } });
        expect(uids(view)).toEqual(['a', 'b']);
        expect(view.devices[0].cells).toEqual([[6, 0], [8, 0]]);
        expect(view.devices[1].cells).toEqual([[8, 0]]);
    });

    it('throws on invalid axes or slice', () =>
    {
        const target = make_space();
        expect(() => camera.project(target, { axes: [0, 0], slice: { 2: 0 } })).toThrow();
        expect(() => camera.project(target, { axes: [0, 3], slice: { 2: 0 } })).toThrow();
        expect(() => camera.project(target, { axes: [0, 1], slice: {} })).toThrow();
        expect(() => camera.project(target, { axes: [0, 1], slice: { 2: 0, 1: 0 } })).toThrow();
        expect(() => camera.project(target, { axes: [0, 1], slice: { 2: 5 } })).toThrow();
        expect(() => camera.project(target, { axes: [0, 1], slice: { 2: 0.5 } })).toThrow();
    });
});

describe('camera.project overlap', () =>
{
    it('keeps devices that overlap in the same layer, in space order', () =>
    {
        const a = box('a', [0, 0, 0], [4, 2, 2]);
        const b = box('b', [2, 0, 0], [4, 2, 2]);
        const view = camera.project(make_space(a, b), { axes: [0, 1], slice: { 2: 1 } });
        expect(uids(view)).toEqual(['a', 'b']);
        expect(view.devices[0].cells).toEqual([[0, 0], [2, 0]]);
        expect(view.devices[1].cells).toEqual([[2, 0], [4, 0]]);
    });

    it('stacked devices on different layers overlap only when the slice is on their shared face', () =>
    {
        const low = box('a', [2, 2, 0], [2, 2, 2]);
        const high = box('b', [2, 2, 2], [2, 2, 2]);
        const target = make_space(low, high);
        const face = camera.project(target, { axes: [0, 1], slice: { 2: 2 } });
        expect(uids(face)).toEqual(['a', 'b']);
        expect(face.devices.map(item => item.cells)).toEqual([[[2, 2]], [[2, 2]]]);
        expect(uids(camera.project(target, { axes: [0, 1], slice: { 2: 1 } }))).toEqual(['a']);
    });

    it('a device spanning layers overlaps a flat one on every layer it touches', () =>
    {
        const tall = box('a', [0, 0, 0], [2, 2, 4]);
        const flat = box('b', [0, 0, 2], [2, 2, 2]);
        const target = make_space(tall, flat);
        expect(uids(camera.project(target, { axes: [0, 1], slice: { 2: 1 } }))).toEqual(['a']);
        expect(uids(camera.project(target, { axes: [0, 1], slice: { 2: 3 } }))).toEqual(['a', 'b']);
    });
});

describe('camera.project moving the camera', () =>
{
    it('sweeping the slice along an axis walks through the layers', () =>
    {
        const low = box('a', [0, 0, 0], [2, 2, 2]);
        const high = box('b', [0, 0, 2], [2, 2, 2]);
        const target = make_space(low, high);
        const sweep = [0, 1, 2, 3, 4].map(z => uids(camera.project(target, { axes: [0, 1], slice: { 2: z } })));
        expect(sweep).toEqual([['a'], ['a'], ['a', 'b'], ['b'], ['b']]);
    });

    it('swapping axes transposes the size and cells', () =>
    {
        const a = box('a', [2, 4, 0], [4, 2, 2]);
        const target = make_space(a);
        const xy = camera.project(target, { axes: [0, 1], slice: { 2: 1 } });
        const yx = camera.project(target, { axes: [1, 0], slice: { 2: 1 } });
        expect(xy.size).toEqual([8, 8]);
        expect(xy.devices[0].cells).toEqual([[2, 4], [4, 4]]);
        expect(yx.devices[0].cells).toEqual([[4, 2], [4, 4]]);
    });

    it('turning to a side view slices along a former view axis', () =>
    {
        const a = box('a', [0, 0, 0], [2, 2, 4]);
        const b = box('b', [0, 4, 2], [2, 2, 2]);
        const target = make_space(a, b);
        const side = camera.project(target, { axes: [1, 2], slice: { 0: 1 } });
        expect(side.size).toEqual([8, 4]);
        expect(uids(side)).toEqual(['a', 'b']);
        expect(side.devices[0].cells).toEqual([[0, 0], [0, 2]]);
        expect(side.devices[1].cells).toEqual([[4, 2]]);
        expect(uids(camera.project(target, { axes: [1, 2], slice: { 0: 3 } }))).toEqual([]);
    });

    it('moves independently along each slice axis of a 4D space', () =>
    {
        const target = new core.space([4, 4, 4, 4]);
        const a = box('a', [0, 0, 0, 0], [2, 2, 2, 2]);
        const b = box('b', [2, 2, 0, 2], [2, 2, 2, 2]);
        target.devices.set(a.device_uid, a);
        target.devices.set(b.device_uid, b);
        const at = (z: number, w: number) => uids(camera.project(target, { axes: [0, 1], slice: { 2: z, 3: w } }));
        expect(at(1, 1)).toEqual(['a']);
        expect(at(1, 3)).toEqual(['b']);
        expect(at(3, 1)).toEqual([]);
        expect(at(1, 2)).toEqual(['a', 'b']);
    });

    it('does not keep state between projections', () =>
    {
        const a = box('a', [0, 0, 0], [2, 2, 2]);
        const target = make_space(a);
        const first = camera.project(target, { axes: [0, 1], slice: { 2: 1 } });
        camera.project(target, { axes: [1, 2], slice: { 0: 5 } });
        expect(camera.project(target, { axes: [0, 1], slice: { 2: 1 } })).toEqual(first);
    });
});
