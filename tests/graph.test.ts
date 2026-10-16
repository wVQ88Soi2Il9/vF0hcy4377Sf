import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as graph from '../src/packs/graph';
import * as test_pack from '../src/packs/test';

function make_port_device(uid: core.uid, position: core.vector, ports: core.port[]): test_pack.port_device
{
    const device = new test_pack.port_device(uid, { namespace: 'test', id: 'port' }, position);
    device.ports = ports;
    return device;
}

function make_space(devices: core.device[]): core.space
{
    const sp = new core.space([32, 32]);
    for (const d of devices)
    {
        sp.devices.set(d.device_uid, d);
    }
    return sp;
}

const in_x: core.port = { port_uid: 'in', offset: [-1, 0], direction: 'input' };
const out_x: core.port = { port_uid: 'out', offset: [1, 0], direction: 'output' };

describe('graph dag', () =>
{
    it('鏈：拓撲順序由邊決定，不依插入順序', () =>
    {
        const sp = make_space([
            make_port_device('c', [4, 0], [in_x]),
            make_port_device('b', [2, 0], [in_x, out_x]),
            make_port_device('a', [0, 0], [out_x])
        ]);
        expect(graph.is_dag(sp)).toBe(true);
        expect(graph.topological_order(sp)).toEqual(['a', 'b', 'c']);
    });

    it('沒有邊時每個 device 各自成點', () =>
    {
        const sp = make_space([make_port_device('a', [0, 0], []), make_port_device('b', [4, 0], [])]);
        expect(graph.topological_order(sp).sort()).toEqual(['a', 'b']);
    });

    it('有環：is_dag 為 false，topological_order 報錯', () =>
    {
        const sp = make_space([
            make_port_device('a', [0, 0], [in_x, out_x]),
            make_port_device('b', [2, 0], [in_x, { port_uid: 'out', offset: [-3, 0], direction: 'output' }])
        ]);
        expect(graph.is_dag(sp)).toBe(false);
        expect(() => graph.topological_order(sp)).toThrow(/cycle/);
    });

    it('重疊的 device 不計入圖：組成的環不算', () =>
    {
        const sp = make_space([
            make_port_device('a', [0, 0], [in_x, out_x]),
            make_port_device('b', [2, 0], [in_x, { port_uid: 'out', offset: [-3, 0], direction: 'output' }]),
            make_port_device('dup', [2, 0], [])
        ]);
        expect(graph.is_dag(sp)).toBe(true);
        expect(graph.topological_order(sp)).toEqual(['a']);
    });
});
