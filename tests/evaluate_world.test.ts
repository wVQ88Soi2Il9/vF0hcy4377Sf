import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as world from '../src/world';
import * as vanilla_alpha from '../src/packs/vanilla_alpha';
import * as vanilla_beta from '../src/packs/vanilla_beta';
import * as vanilla_gamma from '../src/packs/vanilla_gamma';
import * as pipe from '../src/packs/pipe';
import * as test_pack from '../src/packs/test';

const iron = test_pack.iron;

function make_world(): world.pure_world
{
    const catalog = world.compose([vanilla_alpha.manifest, vanilla_beta.manifest, pipe.manifest, test_pack.manifest]);
    return new world.pure_world(catalog, new core.space([32, 32]), 'w');
}

function add(w: world.pure_world, device: core.device, recipe_id?: core.namespaced_id): void
{
    device.selected_recipe_id = recipe_id;
    w.space.devices.set(device.device_uid, device);
}

function make_port_device(uid: core.uid, position: core.vector, ports: core.port[]): test_pack.port_device
{
    const device = new test_pack.port_device(uid, { namespace: 'test', id: 'port' }, position);
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
        const results = vanilla_gamma.evaluate_world(w);
        expect(results.get('p1')).toEqual([iron]);
        expect(results.get('p2')).toEqual([iron]);
        expect(w.space.devices.size).toBe(3);
    });

    it('未接上的 input 為 null item', () =>
    {
        const w = make_world();
        add(w, new pipe.pipe_device('p', pipe_id, [0, 0], [{ axis: 0, delta: 2 }]), pass_through_id);
        expect(vanilla_gamma.evaluate_world(w).get('p')).toEqual([vanilla_gamma.null_stack()]);
    });

    it('未選 recipe 時 output 皆為 null item', () =>
    {
        const w = make_world();
        add(w, new pipe.pipe_device('p', pipe_id, [0, 0], [{ axis: 0, delta: 2 }]));
        expect(vanilla_gamma.evaluate_world(w).get('p')).toEqual([vanilla_gamma.null_stack()]);
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
        expect(() => vanilla_gamma.evaluate_world(w)).toThrow(/Cycle/);
    });

    it('recipe 輸出數量與 output 埠數不符時 throw', () =>
    {
        const w = make_world();
        add(w, make_port_device('s', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]), { namespace: 'test', id: 'emit_two' });
        expect(() => vanilla_gamma.evaluate_world(w)).toThrow(/outputs/);
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
        expect(vanilla_gamma.evaluate_world(w).get('p1')).toEqual([vanilla_gamma.null_stack()]);
    });

    it('重疊的 device：不計入圖、不計算，下游得到 null item', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]), { namespace: 'test', id: 'emit_iron' });
        add(w, make_port_device('dup', [0, 0], []));
        add(w, new pipe.pipe_device('p1', pipe_id, [2, 0], [{ axis: 0, delta: 2 }]), pass_through_id);
        expect(vanilla_beta.build_graph(w.space)).toEqual([]);
        const results = vanilla_gamma.evaluate_world(w);
        expect(results.has('src')).toBe(false);
        expect(results.has('dup')).toBe(false);
        expect(results.get('p1')).toEqual([vanilla_gamma.null_stack()]);
    });

    it('出界的 device：不計入圖、不計算', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [{ port_uid: 'out', offset: [1, 0], direction: 'output' }]), { namespace: 'test', id: 'emit_iron' });
        add(w, new pipe.pipe_device('p1', pipe_id, [2, 0], [{ axis: 0, delta: 32 }]), pass_through_id);
        expect(vanilla_beta.build_graph(w.space)).toEqual([]);
        const results = vanilla_gamma.evaluate_world(w);
        expect(results.has('p1')).toBe(false);
        expect(results.get('src')).toEqual([iron]);
    });

    it('重疊的 device 組成的環不 throw', () =>
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
        add(w, make_port_device('dup', [2, 0], []));
        expect(vanilla_gamma.evaluate_world(w).get('a')).toEqual([vanilla_gamma.null_stack()]);
    });
});

const out_x: core.port = { port_uid: 'out', offset: [1, 0], direction: 'output' };
const in_x: core.port = { port_uid: 'in', offset: [-1, 0], direction: 'input' };
const iron_pipe_id: core.namespaced_id = { namespace: 'test', id: 'iron_pipe' };

describe('evaluate_world 反壓', () =>
{
    it('source 3 → pipe min(x, 2)：pipe 取最小消耗 2，上游降為 2', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [out_x]), { namespace: 'test', id: 'emit_iron' });
        add(w, new pipe.pipe_device('p', pipe_id, [2, 0], [{ axis: 0, delta: 2 }]), iron_pipe_id);
        const results = vanilla_gamma.evaluate_world(w);
        expect(results.get('src')![0].quantity).toBeCloseTo(2);
        expect(results.get('p')![0].quantity).toBeCloseTo(2);
    });

    it('source 3 → pass_through → pipe min(x, 2)：反壓沿鏈傳回', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [out_x]), { namespace: 'test', id: 'emit_iron' });
        add(w, new pipe.pipe_device('p1', pipe_id, [2, 0], [{ axis: 0, delta: 2 }]), pass_through_id);
        add(w, new pipe.pipe_device('p2', pipe_id, [6, 0], [{ axis: 0, delta: 2 }]), iron_pipe_id);
        const results = vanilla_gamma.evaluate_world(w);
        expect(results.get('src')![0].quantity).toBeCloseTo(2);
        expect(results.get('p1')![0].quantity).toBeCloseTo(2);
        expect(results.get('p2')![0].quantity).toBeCloseTo(2);
    });

    it('sink 全收', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [out_x]), { namespace: 'test', id: 'emit_iron' });
        add(w, make_port_device('sink', [2, 0], [in_x]), { namespace: 'test', id: 'sink' });
        const results = vanilla_gamma.evaluate_world(w);
        expect(results.get('src')![0].quantity).toBeCloseTo(3);
        expect(results.get('sink')).toEqual([]);
    });

    it('item 不符：pipe 輸出 0，消耗自然為 0，上游反壓為 0', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [out_x]), { namespace: 'test', id: 'emit_coal' });
        add(w, new pipe.pipe_device('p', pipe_id, [2, 0], [{ axis: 0, delta: 2 }]), iron_pipe_id);
        const results = vanilla_gamma.evaluate_world(w);
        expect(results.get('src')![0].quantity).toBe(0);
        expect(results.get('p')).toEqual([vanilla_gamma.null_stack()]);
    });

    it('未選 recipe 的 device 不消耗，上游反壓為 0', () =>
    {
        const w = make_world();
        add(w, make_port_device('src', [0, 0], [out_x]), { namespace: 'test', id: 'emit_iron' });
        add(w, make_port_device('idle', [2, 0], [in_x]));
        expect(vanilla_gamma.evaluate_world(w).get('src')![0].quantity).toBe(0);
    });

    // a → merge ← b；merge.out = min(a + b, 2) 沒接上
    function make_merge_world(rule?: vanilla_gamma.operating_rule): world.pure_world
    {
        const w = make_world();
        add(w, make_port_device('a', [0, 2], [out_x]), { namespace: 'test', id: 'emit_iron' });
        add(w, make_port_device('b', [2, 0], [{ port_uid: 'out', offset: [0, 1], direction: 'output' }]), { namespace: 'test', id: 'emit_iron' });
        const merger = make_port_device('m', [2, 2], [
            in_x,
            { port_uid: 'in_b', offset: [0, -1], direction: 'input' },
            out_x
        ]);
        add(w, merger, { namespace: 'test', id: 'merge_two' });
        vanilla_gamma.set_device_rule(merger, rule);
        return w;
    }

    it('等比例（recipe 預設）：平坦區取最小消耗，a、b 各 1', () =>
    {
        const results = vanilla_gamma.evaluate_world(make_merge_world());
        expect(results.get('a')![0].quantity).toBeCloseTo(1);
        expect(results.get('b')![0].quantity).toBeCloseTo(1);
        expect(results.get('m')![0].quantity).toBeCloseTo(2);
    });

    it('依埠順序（device 覆寫）：低優先的埠先讓出', () =>
    {
        const first = vanilla_gamma.evaluate_world(make_merge_world({ kind: 'priority', order: [0, 1] }));
        expect(first.get('a')![0].quantity).toBeCloseTo(2);
        expect(first.get('b')![0].quantity).toBeCloseTo(0);
        const second = vanilla_gamma.evaluate_world(make_merge_world({ kind: 'priority', order: [1, 0] }));
        expect(second.get('a')![0].quantity).toBeCloseTo(0);
        expect(second.get('b')![0].quantity).toBeCloseTo(2);
    });

    it('輸入 ≥ 2 卻沒有規則時 throw', () =>
    {
        const w = make_world();
        add(w, make_port_device('m', [0, 0], [in_x, { port_uid: 'in_b', offset: [0, -1], direction: 'input' }]), pass_through_id);
        expect(() => vanilla_gamma.evaluate_world(w)).toThrow(/no operating rule/);
    });
});
