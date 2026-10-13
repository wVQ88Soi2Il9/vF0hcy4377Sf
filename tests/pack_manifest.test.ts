import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as world from '../src/world';
import * as vanilla_alpha from '../src/packs/vanilla_alpha';

class mock_device extends core.device
{
    public get_shape(): core.vector[] { return [[0, 0]]; }
    public get_port(): core.port[] { return []; }
}

const def_id: core.namespaced_id = { namespace: 'test', id: 'mock' };

function summarize(change_set: world.applied_op[]): string[]
{
    return change_set.map(a => `${a.direction}:${a.op.id}`);
}

describe('compose', () =>
{
    it('依 manifest 順序合併 provides 與 on，並在之後依序執行 patch', () =>
    {
        const order: string[] = [];
        const handler_a = () => order.push('a');
        const handler_b = () => order.push('b');

        const pack_a: core.pack_manifest =
        {
            pack_id:  'pack_a',
            provides: { items: { stone: { namespace: 'pack_a', id: 'stone' } } },
            on:       { 'core:committed': handler_a }
        };
        const pack_b: core.pack_manifest =
        {
            pack_id: 'pack_b',
            on:      { 'core:committed': handler_b },
            patch(draft)
            {
                draft.registry.get('pack_a')!.items!.stone.other_info = { patched_by: 'pack_b' };
                const list = draft.handlers.get('core')!.get('committed')!;
                list.splice(list.indexOf(handler_a), 1);
            }
        };

        const catalog = world.compose([pack_a, pack_b]);

        expect(catalog.registry.get('pack_a')!.pack_id).toBe('pack_a');
        expect(catalog.registry.get('pack_a')!.items!.stone.other_info).toEqual({ patched_by: 'pack_b' });
        expect(catalog.handlers.get('core')!.get('committed')).toEqual([handler_b]);
    });
});

describe('world commit', () =>
{
    function setup()
    {
        const log: { world_id: string; change: string[] }[] = [];
        const observer: core.pack_manifest =
        {
            pack_id:      'observer',
            create_state: () => ({ count: 0 }),
            on:
            {
                'core:committed': (w: world.pure_world, change_set: world.applied_op[]) =>
                {
                    (w.pack_state.get('observer') as { count: number }).count += 1;
                    log.push({ world_id: w.id, change: summarize(change_set) });
                }
            }
        };
        const catalog = world.compose([vanilla_alpha.manifest, observer]);
        return { catalog, log };
    }

    it('submit / undo / redo / jump 都經由 commit 發出 change_set', () =>
    {
        const { catalog, log } = setup();
        const w = new vanilla_alpha.std_world(catalog, new core.space([8, 8]), 'w');

        const dev = w.create_device(mock_device, def_id, [0, 0]);
        w.move_device(dev.device_uid, [2, 2]);
        w.undo();
        w.redo();
        w.jump_to_root();
        w.jump_to_leaf();

        expect(log.map(e => e.change)).toEqual([
            ['execute:create_device'],
            ['execute:move_device'],
            ['inverse:move_device'],
            ['execute:move_device'],
            ['inverse:move_device', 'inverse:create_device'],
            ['execute:create_device', 'execute:move_device']
        ]);
        expect(w.space.devices.get(dev.device_uid)!.position).toEqual([2, 2]);
    });

    it('跨分支 jump_to 的 change_set 先 inverse 至 LCA 再 execute', () =>
    {
        const { catalog, log } = setup();
        const w = new vanilla_alpha.std_world(catalog, new core.space([8, 8]), 'w');

        const dev = w.create_device(mock_device, def_id, [0, 0]);
        w.move_device(dev.device_uid, [2, 2]);
        const branch_a = w.history.current_history_uid;
        w.undo();
        w.select_recipe(dev.device_uid, { namespace: 'test', id: 'r' });
        log.length = 0;

        w.jump_to(branch_a);

        expect(log.map(e => e.change)).toEqual([['inverse:select_recipe', 'execute:move_device']]);
        expect(w.space.devices.get(dev.device_uid)!.position).toEqual([2, 2]);
        expect(w.space.devices.get(dev.device_uid)!.selected_recipe_id).toBeUndefined();
    });

    it('未移動時不發出事件；刪除歷史節點以空 change_set 發出', () =>
    {
        const { catalog, log } = setup();
        const w = new vanilla_alpha.std_world(catalog, new core.space([8, 8]), 'w');

        expect(w.undo()).toBe(false);
        expect(log).toEqual([]);

        w.create_device(mock_device, def_id, [0, 0]);
        const leaf = w.history.current_history_uid;
        w.undo();
        log.length = 0;

        expect(w.delete_history_node(leaf)).toBe(true);
        expect(log.map(e => e.change)).toEqual([[]]);
    });

    it('handler 全域共用，但 pack_state 與事件只作用於傳入的 world', () =>
    {
        const { catalog, log } = setup();
        const w1 = new vanilla_alpha.std_world(catalog, new core.space([8, 8]), 'w1');
        const w2 = new vanilla_alpha.std_world(catalog, new core.space([8, 8]), 'w2');

        w1.create_device(mock_device, def_id, [0, 0]);
        w1.create_device(mock_device, def_id, [2, 0]);
        w2.create_device(mock_device, def_id, [0, 0]);

        expect(w1.pack_state.get('observer')).toEqual({ count: 2 });
        expect(w2.pack_state.get('observer')).toEqual({ count: 1 });
        expect(log.map(e => e.world_id)).toEqual(['w1', 'w1', 'w2']);
    });
});
