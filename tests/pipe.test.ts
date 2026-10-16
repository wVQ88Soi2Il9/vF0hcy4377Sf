import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as pipe from '../src/packs/pipe';

const def_id: core.namespaced_id = { namespace: 'pipe', id: 'pipe' };

describe('shape_to_segments', () =>
{
    it('折點轉為相對位移段', () =>
    {
        expect(pipe.shape_to_segments([[0, 0, 0], [4, 0, 0], [4, 2, 0]]))
            .toEqual([{ axis: 0, delta: 4 }, { axis: 1, delta: 2 }]);
    });

    it('斜向兩點依軸序拆段', () =>
    {
        expect(pipe.shape_to_segments([[0, 0], [2, -4]]))
            .toEqual([{ axis: 0, delta: 2 }, { axis: 1, delta: -4 }]);
    });
});

describe('pipe_device', () =>
{
    const l_shape: pipe.pipe_segment[] = [{ axis: 0, delta: 4 }, { axis: 1, delta: -2 }];

    it('L 形路徑的 shape', () =>
    {
        const device = new pipe.pipe_device('p', def_id, [4, 6], l_shape);
        expect(device.position).toEqual([4, 6]);
        expect(device.get_shape()).toEqual([[0, 0], [2, 0], [4, 0], [4, -2]]);
    });

    it('input 在起點反方向半格，output 在終點同方向半格', () =>
    {
        const device = new pipe.pipe_device('p', def_id, [0, 0], l_shape);
        expect(device.get_port()).toEqual([
            { port_uid: 'in',  offset: [-1, 0], direction: 'input' },
            { port_uid: 'out', offset: [4, -3], direction: 'output' }
        ]);
    });

    it('3 維直線', () =>
    {
        const device = new pipe.pipe_device('p', def_id, [0, 0, 0], [{ axis: 2, delta: 2 }]);
        expect(device.get_shape()).toEqual([[0, 0, 0], [0, 0, 2]]);
        expect(device.get_port().map(p => p.offset)).toEqual([[0, 0, -1], [0, 0, 3]]);
    });

    it('奇數 delta 報錯', () =>
    {
        const device = new pipe.pipe_device('p', def_id, [0, 0], [{ axis: 0, delta: 3 }]);
        expect(() => device.get_shape()).toThrow();
    });
});
