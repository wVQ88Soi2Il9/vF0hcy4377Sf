import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as world from '../src/world';
import * as vanilla_alpha from '../src/packs/vanilla_alpha';
import * as vanilla_beta from '../src/packs/vanilla_beta';
import * as pipe from '../src/packs/pipe';

const iron: core.item_stack = { item_id: { namespace: 'test', id: 'iron' }, quantity: 3 };

/** 埠由建構時給定的測試裝置。 */
class port_device extends core.device
{
    public ports: core.port[] = [];
    public get_shape(): core.vector[] { return [[0, 0]]; }
    public get_port(): core.port[] { return this.ports; }
}

const emit_iron: core.recipe =
{
    namespace: 'test',
    id:        'emit_iron',
    evaluate(): core.item_stack[] { return [{ ...iron }]; }
};

const emit_two: core.recipe =
{
    namespace: 'test',
    id:        'emit_two',
    evaluate(): core.item_stack[] { return [{ ...iron }, { ...iron }]; }
};

const pass_through: core.recipe =
{
    namespace: 'test',
    id:        'pass_through',
    evaluate(context: vanilla_beta.recipe_context): core.item_stack[] { return context.inputs.map(s => ({ ...s })); }
};

const test_pack: core.pack_manifest = { pack_id: 'test', provides: { recipes: { emit_iron, emit_two, pass_through } } };

function make_world(): world.pure_world
{
    const catalog = world.compose([vanilla_alpha.manifest, vanilla_beta.manifest, pipe.manifest, test_pack]);
    return new world.pure_world(catalog, new core.space([32, 32]), 'w');
}

function add(w: world.pure_world, device: core.device, recipe_id?: core.namespaced_id): void
{
    device.selected_recipe_id = recipe_id;
    w.space.devices.set(device.device_uid, device);
}

function make_port_device(uid: core.uid, position: core.vector, ports: core.port[]): port_device
{
    const device = new port_device(uid, { namespace: 'test', id: 'port' }, position);
    device.ports = ports;
    return device;
}

const pipe_id: core.namespaced_id = { namespace: 'pipe', id: 'pipe' };
const pass_through_id: core.namespaced_id = { namespace: 'test', id: 'pass_through' };

describe('evaluate_world', () =>
{
    it('source → pipe → pipe：in = out 沿鏈傳遞', () =>
    {
        const w = make_world();
        // pipe 先加入，確認順序由圖決定而非插入順序
        add(w, new pipe.pipe_device('p2', pipe_id, [6, 0], [{ axis: 0, delta: 2 }]), pass_through_id);
        add(w, new pipe.pipe_device('p1', pipe_id, [2, 0], [{ axis: 0, delta: 2 }]), pass_through_id);
        add(w, make_port_device('src', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]), { namespace: 'test', id: 'emit_iron' });

        expect(vanilla_beta.build_graph(w.space)).toHaveLength(2);
        const results = vanilla_beta.evaluate_world(w);
        expect(results.get('p1')).toEqual([iron]);
        expect(results.get('p2')).toEqual([iron]);
        expect(w.space.devices.size).toBe(3);
    });

    it('未接上的 input 為 null item', () =>
    {
        const w = make_world();
        add(w, new pipe.pipe_device('p', pipe_id, [0, 0], [{ axis: 0, delta: 2 }]), pass_through_id);
        expect(vanilla_beta.evaluate_world(w).get('p')).toEqual([vanilla_beta.null_stack()]);
    });

    it('未選 recipe 時 output 皆為 null item', () =>
    {
        const w = make_world();
        add(w, new pipe.pipe_device('p', pipe_id, [0, 0], [{ axis: 0, delta: 2 }]));
        expect(vanilla_beta.evaluate_world(w).get('p')).toEqual([vanilla_beta.null_stack()]);
    });

    it('有環時 throw', () =>
    {
        const w = make_world();
        add(w, make_port_device('a', [0, 0], [
            { port_uid: 'in',  offset: [-1, 0], direction: 'input' },
            { port_uid: 'out', offset: [1, 0],  direction: 'output' }
        ]), pass_through_id);
        add(w, make_port_device('b', [2, 0], [
            { port_uid: 'in',  offset: [-1, 0], direction: 'input' },
            { port_uid: 'out', offset: [-3, 0], direction: 'output' }
        ]), pass_through_id);
        expect(() => vanilla_beta.evaluate_world(w)).toThrow(/Cycle/);
    });

    it('recipe 輸出數量與 output 埠數不符時 throw', () =>
    {
        const w = make_world();
        add(w, make_port_device('s', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]), { namespace: 'test', id: 'emit_two' });
        expect(() => vanilla_beta.evaluate_world(w)).toThrow(/outputs/);
    });

    it('同一座標 2 個 output 埠：不計入圖', () =>
    {
        const w = make_world();
        add(w, make_port_device('a', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]));
        add(w, make_port_device('b', [2, 0], [{ port_uid: 'out', offset: [-1, 0], direction: 'output' }]));
        expect(vanilla_beta.build_graph(w.space)).toEqual([]);
    });

    it('同一座標 1 個 output、2 個 input：不計入圖，下游得到 null item', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]), { namespace: 'test', id: 'emit_iron' });
        add(w, new pipe.pipe_device('p1', pipe_id, [2, 0], [{ axis: 0, delta: 2 }]), pass_through_id);
        add(w, make_port_device('x', [2, 2], [{ port_uid: 'in', offset: [-1, -2], direction: 'input' }]));
        expect(vanilla_beta.build_graph(w.space)).toEqual([]);
        expect(vanilla_beta.evaluate_world(w).get('p1')).toEqual([vanilla_beta.null_stack()]);
    });
});
