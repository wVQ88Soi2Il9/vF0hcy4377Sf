import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as world from '../src/world';
import * as vanilla_alpha from '../src/packs/vanilla_alpha';
import * as vanilla_beta from '../src/packs/vanilla_beta';
import * as pipe from '../src/packs/pipe';
import * as graph from '../src/packs/graph';
import * as test_ui from '../src/packs/test_ui';

function make_world(): world.pure_world
{
    const catalog = world.compose([vanilla_alpha.manifest, vanilla_beta.manifest, pipe.manifest, test_ui.manifest]);
    return new world.pure_world(catalog, new core.space([32, 32]), 'w');
}

function add(w: world.pure_world, device: core.device): void
{
    w.space.devices.set(device.device_uid, device);
}

function make_port_device(uid: core.uid, position: core.vector, ports: core.port[]): test_ui.port_device
{
    const device = new test_ui.port_device(uid, { namespace: 'test_ui', id: 'port' }, position);
    device.ports = ports;
    return device;
}

const pipe_id: core.namespaced_id = { namespace: 'pipe', id: 'pipe' };

describe('build_graph', () =>
{
    it('source → pipe → pipe：同一座標 1 個 output、1 個 input 時連邊', () =>
    {
        const w = make_world();
        add(w, new pipe.pipe_device('p2', pipe_id, [6, 0], [{ axis: 0, delta: 2 }]));
        add(w, new pipe.pipe_device('p1', pipe_id, [2, 0], [{ axis: 0, delta: 2 }]));
        add(w, make_port_device('src', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]));

        const edges = graph.build_graph(w.space);
        expect(edges).toHaveLength(2);
        expect(edges).toContainEqual({ from_uid: 'src', from_index: 0, to_uid: 'p1', to_index: 0 });
        expect(edges).toContainEqual({ from_uid: 'p1', from_index: 0, to_uid: 'p2', to_index: 0 });
    });

    it('同一座標 2 個 output 埠：不計入圖', () =>
    {
        const w = make_world();
        add(w, make_port_device('a', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]));
        add(w, make_port_device('b', [2, 0], [{ port_uid: 'out', offset: [-1, 0], direction: 'output' }]));
        expect(graph.build_graph(w.space)).toEqual([]);
    });

    it('同一座標 1 個 output、2 個 input：不計入圖', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]));
        add(w, new pipe.pipe_device('p1', pipe_id, [2, 0], [{ axis: 0, delta: 2 }]));
        add(w, make_port_device('x', [2, 2], [{ port_uid: 'in', offset: [-1, -2], direction: 'input' }]));
        expect(graph.build_graph(w.space)).toEqual([]);
    });

    it('重疊的 device：不計入圖，也不在 graph_devices 中', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]));
        add(w, make_port_device('dup', [0, 0], []));
        add(w, new pipe.pipe_device('p1', pipe_id, [2, 0], [{ axis: 0, delta: 2 }]));
        expect(graph.build_graph(w.space)).toEqual([]);
        expect(graph.graph_devices(w.space).map(d => d.device_uid)).toEqual(['p1']);
    });

    it('出界的 device：不計入圖，也不在 graph_devices 中', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]));
        add(w, new pipe.pipe_device('p1', pipe_id, [2, 0], [{ axis: 0, delta: 32 }]));
        expect(graph.build_graph(w.space)).toEqual([]);
        expect(graph.graph_devices(w.space).map(d => d.device_uid)).toEqual(['src']);
    });
});
