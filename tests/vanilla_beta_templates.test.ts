import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as world from '../src/world';
import * as vanilla_alpha from '../src/packs/vanilla_alpha';
import * as vanilla_beta from '../src/packs/vanilla_beta';
import * as cli from '../src/packs/cli';

class mock_device extends core.device
{
    public get_shape(): core.vector[] { return [[0, 0, 0]]; }
    public get_port(): core.port[] { return []; }
}

const test_pack: core.pack_manifest = { pack_id: 'test', provides: { devices: { mock: mock_device } } };

function make_world(): world.pure_world
{
    const catalog = world.compose([vanilla_alpha.manifest, vanilla_beta.manifest, cli.manifest, test_pack]);
    return new world.pure_world(catalog, new core.space([16, 16, 4]), 'w');
}

function only_device(w: world.pure_world): core.device
{
    const devices = [...w.space.devices.values()];
    expect(devices.length).toBe(1);
    return devices[0];
}

describe('vanilla_beta op_templates 經 cli 執行', () =>
{
    it('create / move / select_recipe / delete 進入歷史，undo / redo 可重播', () =>
    {
        const w = make_world();

        cli.run(w, w, 'create_device test:mock 4 4 0');
        const dev = only_device(w);
        expect(dev.device_uid).toMatch(/^[0-9a-f]{16}$/);
        expect(dev.position).toEqual([4, 4, 0]);

        cli.run(w, w, `move_device ${dev.device_uid} 8 8 2`);
        expect(dev.position).toEqual([8, 8, 2]);

        cli.run(w, w, `select_recipe ${dev.device_uid} test:r`);
        expect(dev.selected_recipe_id).toEqual({ namespace: 'test', id: 'r' });

        cli.run(w, w, `select_recipe ${dev.device_uid}`);
        expect(dev.selected_recipe_id).toBeUndefined();

        cli.run(w, w, `delete_device ${dev.device_uid}`);
        expect(w.space.devices.size).toBe(0);

        w.undo();
        expect(only_device(w).device_uid).toBe(dev.device_uid);
        w.undo();
        w.undo();
        w.undo();
        expect(only_device(w).position).toEqual([4, 4, 0]);
        w.redo();
        expect(only_device(w).position).toEqual([8, 8, 2]);
    });

    it('類別必須寫 pack:id', () =>
    {
        const w = make_world();
        expect(() => cli.run(w, w, 'create_device mock 4 4 0')).toThrow(/must be "pack:id"/);
        expect(() => cli.run(w, w, 'create_device test:none 4 4 0')).toThrow(/not found in registry/);
    });

    it('座標數量必須等於維度且全為偶數，錯誤不進入歷史', () =>
    {
        const w = make_world();
        expect(() => cli.run(w, w, 'create_device test:mock 4 4')).toThrow(/Expected 3 coordinates, got 2/);
        expect(() => cli.run(w, w, 'create_device test:mock 4 4 0 2')).toThrow(/Expected 3 coordinates, got 4/);
        expect(() => cli.run(w, w, 'create_device test:mock 4 3 0')).toThrow(/even/);
        expect(w.history.nodes.size).toBe(1);
    });

    it('uid 必須是字串', () =>
    {
        const w = make_world();
        expect(() => cli.run(w, w, 'delete_device 7')).toThrow(/uid string/);
        expect(() => cli.run(w, w, 'delete_device')).toThrow(/Usage: delete_device <uid>/);
    });

    it('help 由 cli 常數表提供上游描述', () =>
    {
        const w = make_world();
        expect(cli.run(w, w, 'help create_device')).toMatch(/^vanilla_beta:create_device — create_device <pack:id>/);
    });
});

describe('parse', () =>
{
    it('parse_int 接受整數，其他報錯', () =>
    {
        expect(vanilla_beta.parse_int(4, 'x')).toBe(4);
        expect(() => vanilla_beta.parse_int(4.5, 'x')).toThrow(/integer/);
        expect(() => vanilla_beta.parse_int('4', 'x')).toThrow(/integer/);
    });

    it('parse_vector 取出指定數量的整數座標', () =>
    {
        expect(vanilla_beta.parse_vector(['conveyor', 4, 4, 0], 1, 3, 'pos')).toEqual([4, 4, 0]);
        expect(() => vanilla_beta.parse_vector(['conveyor', 4, 4], 1, 3, 'pos')).toThrow(/needs 3 integers, got 2/);
        expect(() => vanilla_beta.parse_vector([4, 'a'], 0, 2, 'pos')).toThrow(/pos\[1\]/);
    });
});
