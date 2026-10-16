import { describe, it, expect } from 'vitest';
import * as core from '@/core';
import * as world from '@/world';
import * as cli from '@/packs/cli';
import * as camera from '@/packs/camera';

function make_world(): world.pure_world
{
    const catalog = world.compose([cli.manifest, camera.manifest]);
    return new world.pure_world(catalog, new core.space([8, 8, 4, 4]), 'cam');
}

describe('camera world state', () =>
{
    it('creates the default view on first read', () =>
    {
        const w = make_world();
        expect(camera.get_state(w)).toEqual({ view: { axes: [0, 1], slice: { 2: 1, 3: 1 } }, origin: [0, 0], scale: 1 });
        expect(camera.get_state(w)).toBe(camera.get_state(w));
    });

    it('set_state stores; invalid state throws and keeps the old one', () =>
    {
        const w = make_world();
        const before = camera.get_state(w);
        camera.set_state(w, camera.pan(before, 10, 0));
        expect(camera.get_state(w).origin).toEqual([-10, 0]);

        const current = camera.get_state(w);
        expect(() => camera.set_state(w, { ...current, view: { axes: [0, 1], slice: { 2: 9, 3: 1 } } })).toThrow();
        expect(() => camera.set_state(w, { ...current, scale: 0 })).toThrow();
        expect(camera.get_state(w)).toBe(current);
    });

    it('throws when the camera pack is not composed', () =>
    {
        const w = new world.pure_world(world.compose([cli.manifest]), new core.space([4, 4]), 'none');
        expect(() => camera.get_state(w)).toThrow(/camera pack/);
    });
});

describe('camera view command', () =>
{
    it('reads and sets the view through cli without any ui', () =>
    {
        const w = make_world();
        expect(cli.run(w, 'view')).toBe('view d0 d1 d2=1 d3=1');
        expect(cli.run(w, 'view d3=2')).toBe('view d0 d1 d2=1 d3=2');
        expect(cli.run(w, 'view d2 d0 d1=3')).toBe('view d2 d0 d1=3 d3=2');
        expect(camera.get_state(w).view).toEqual({ axes: [2, 0], slice: { 1: 3, 3: 2 } });
    });

    it('rejects bad arguments and leaves the view unchanged', () =>
    {
        const w = make_world();
        for (const bad of ['view d0', 'view d0 d0', 'view d1=9', 'view d2=9', 'view d0=1', 'view x'])
        {
            expect(() => cli.run(w, bad)).toThrow();
        }
        expect(cli.run(w, 'view')).toBe('view d0 d1 d2=1 d3=1');
    });
});
