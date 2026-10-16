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

/** 以值比較的 space 快照：與 devices 的走訪順序無關。 */
function snapshot(sp: core.space): string
{
    const entries = [...sp.devices.values()]
        .map(d => ({ uid: d.device_uid, pos: d.position, recipe: d.selected_recipe_id ?? null }))
        .sort((a, b) => a.uid.localeCompare(b.uid));
    return JSON.stringify(entries);
}

function make_rng(seed: number): () => number
{
    let state = seed;
    return () =>
    {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

describe('uid 唯一性（目標）', () =>
{
    it('create 遇到已存在的 uid 時 Fail-Fast', () =>
    {
        const w = new world.pure_world(world.compose([]), new core.space([8, 8]), 'w');
        const sp = w.space;
        vanilla_alpha.create_device_template.create(w, '7', mock_device, def_id, [0, 0]).execute(sp);

        const duplicate = vanilla_alpha.create_device_template.create(w, '7', mock_device, def_id, [2, 2]);
        expect(() => duplicate.execute(sp)).toThrowError('Device with UID 7 already exists in space.');
        expect(sp.devices.size).toBe(1);
    });

    it('delete 的 inverse 遇到 uid 已被佔用時 Fail-Fast', () =>
    {
        const w = new world.pure_world(world.compose([]), new core.space([8, 8]), 'w');
        const sp = w.space;
        vanilla_alpha.create_device_template.create(w, '7', mock_device, def_id, [0, 0]).execute(sp);

        const del = vanilla_alpha.delete_device_template.create(w, '7');
        del.execute(sp);
        vanilla_alpha.create_device_template.create(w, '7', mock_device, def_id, [2, 2]).execute(sp);

        expect(() => del.inverse(sp)).toThrowError('Device with UID 7 already exists in space.');
    });
});

describe('space 只取決於游標所在節點，與走法無關', () =>
{
    it.each([1, 2, 3, 4, 5])('隨機走訪歷史樹（seed %i），同一節點的快照恆相同', (seed) =>
    {
        const rng = make_rng(seed);
        const pick = <T>(items: T[]): T => items[Math.floor(rng() * items.length)];

        const w = new world.pure_world(world.compose([vanilla_alpha.manifest]), new core.space([32, 32]), 'w');
        let next_uid = 0;
        const seen = new Map<core.uid, string>();
        let revisits = 0;

        for (let step = 0; step < 300; step++)
        {
            const r = rng();
            const uids = [...w.space.devices.keys()];

            if (uids.length === 0 || r < 0.25)
            {
                w.submit([vanilla_alpha.create_device_template.create(w, String(next_uid++), mock_device, def_id, [Math.floor(rng() * 16) * 2, Math.floor(rng() * 16) * 2])]);
            }
            else if (r < 0.45)
            {
                w.submit([vanilla_alpha.move_device_template.create(w, pick(uids), [Math.floor(rng() * 16) * 2, Math.floor(rng() * 16) * 2])]);
            }
            else if (r < 0.55)
            {
                w.submit([vanilla_alpha.select_recipe_template.create(w, pick(uids), rng() < 0.2 ? undefined : { namespace: 'test', id: `r${Math.floor(rng() * 3)}` })]);
            }
            else if (r < 0.62)
            {
                w.submit([vanilla_alpha.delete_device_template.create(w, pick(uids))]);
            }
            else
            {
                w.jump_to(pick([...w.history.nodes.keys()]));
            }

            const current = w.history.current_history_uid;
            const snap = snapshot(w.space);
            if (seen.has(current))
            {
                revisits += 1;
                expect(snap).toBe(seen.get(current));
            }
            else
            {
                seen.set(current, snap);
            }
        }

        expect(revisits).toBeGreaterThan(20);
    });
});
