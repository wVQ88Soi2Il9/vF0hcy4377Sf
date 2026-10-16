import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as world from '../src/world';
import * as vanilla_alpha from '../src/packs/vanilla_alpha';
import * as vanilla_beta from '../src/packs/vanilla_beta';
import * as vanilla_gamma from '../src/packs/vanilla_gamma';
import * as cli from '../src/packs/cli';

class two_input_device extends core.device
{
    public get_shape(): core.vector[] { return [[0, 0, 0]]; }
    public get_port(): core.port[]
    {
        return [
            { port_uid: 'a', offset: [-1, 0, 0], direction: 'input' },
            { port_uid: 'b', offset: [1, 0, 0],  direction: 'input' }
        ];
    }
}

const test_pack: core.pack_manifest = { pack_id: 'test', provides: { devices: { two_input: two_input_device } } };

function make_world(): world.pure_world
{
    const catalog = world.compose([vanilla_alpha.manifest, vanilla_beta.manifest, vanilla_gamma.manifest, cli.manifest, test_pack]);
    return new world.pure_world(catalog, new core.space([16, 16, 4]), 'w');
}

function only_device(w: world.pure_world): core.device
{
    const devices = [...w.space.devices.values()];
    expect(devices.length).toBe(1);
    return devices[0];
}

describe('vanilla_gamma select_rule', () =>
{
    it('設定與清除覆寫值，undo 可還原；select_recipe 不清除覆寫值', () =>
    {
        const w = make_world();
        cli.run(w, w, 'create_device test:two_input 4 4 0');
        const dev = only_device(w);

        cli.run(w, w, `select_rule ${dev.device_uid} priority 1 0`);
        expect(vanilla_gamma.get_device_rule(dev)).toEqual({ kind: 'priority', order: [1, 0] });
        cli.run(w, w, `select_rule ${dev.device_uid} proportional`);
        expect(vanilla_gamma.get_device_rule(dev)).toEqual({ kind: 'proportional' });
        w.undo();
        expect(vanilla_gamma.get_device_rule(dev)).toEqual({ kind: 'priority', order: [1, 0] });
        w.redo();
        expect(vanilla_gamma.get_device_rule(dev)).toEqual({ kind: 'proportional' });

        cli.run(w, w, `select_recipe ${dev.device_uid} test:r`);
        expect(vanilla_gamma.get_device_rule(dev)).toEqual({ kind: 'proportional' });

        cli.run(w, w, `select_rule ${dev.device_uid}`);
        expect(vanilla_gamma.get_device_rule(dev)).toBeUndefined();
    });

    it('order 必須是 input 埠索引的排列，錯誤不進入歷史', () =>
    {
        const w = make_world();
        cli.run(w, w, 'create_device test:two_input 4 4 0');
        const uid = only_device(w).device_uid;
        const nodes = w.history.nodes.size;
        expect(() => cli.run(w, w, `select_rule ${uid} priority 0 0`)).toThrow(/permutation/);
        expect(() => cli.run(w, w, `select_rule ${uid} priority 0`)).toThrow(/permutation/);
        expect(() => cli.run(w, w, `select_rule ${uid} fastest`)).toThrow(/Usage: select_rule/);
        expect(() => cli.run(w, w, 'select_rule none proportional')).toThrow(/not found/);
        expect(w.history.nodes.size).toBe(nodes);
    });
});
