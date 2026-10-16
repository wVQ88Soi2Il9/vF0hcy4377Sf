import { describe, it, expect } from 'vitest';
import * as core from '@/core';
import * as camera from '@/packs/camera';

const start: camera.camera_state = { view: { axes: [0, 1], slice: { 2: 1 } }, origin: [0, 0], scale: 10 };

describe('camera state', () =>
{
    it('pan moves the content with the cursor', () =>
    {
        const moved = camera.pan(start, 20, -10);
        expect(moved.origin).toEqual([-2, 1]);
        expect(moved.scale).toBe(10);
        expect(start.origin).toEqual([0, 0]);
    });

    it('zoom_at keeps the space point under the cursor fixed', () =>
    {
        const at: [number, number] = [30, 40];
        const before = camera.window_of(start, [100, 100]);
        const zoomed = camera.zoom_at(start, 2, at);
        const after = camera.window_of(zoomed, [100, 100]);
        expect(zoomed.scale).toBe(20);
        expect(before[0] + at[0] / start.scale).toBeCloseTo(after[0] + at[0] / zoomed.scale);
        expect(before[1] + at[1] / start.scale).toBeCloseTo(after[1] + at[1] / zoomed.scale);
        expect(after[2]).toBe(5);
    });

    it('zooming in then out by the same factor restores the state', () =>
    {
        const back = camera.zoom_at(camera.zoom_at(start, 3, [7, 9]), 1 / 3, [7, 9]);
        expect(back.scale).toBeCloseTo(start.scale);
        expect(back.origin[0]).toBeCloseTo(0);
        expect(back.origin[1]).toBeCloseTo(0);
    });

    it('fit centres the whole space on the view axes', () =>
    {
        const target = new core.space([8, 4, 4]);
        const fitted = camera.fit(start, target, [400, 400]);
        expect(fitted.scale).toBe(50);
        expect(camera.window_of(fitted, [400, 400])).toEqual([0, -2, 8, 8]);

        const side = camera.fit({ ...start, view: { axes: [2, 0], slice: { 1: 1 } } }, target, [400, 400]);
        expect(camera.window_of(side, [400, 400])).toEqual([-2, 0, 8, 8]);
    });

    it('can look outside the space (infinite canvas)', () =>
    {
        const far = camera.pan(start, 10000, 10000);
        expect(camera.window_of(far, [100, 100])).toEqual([-1000, -1000, 10, 10]);
    });

    it('throws on invalid input', () =>
    {
        expect(() => camera.zoom_at(start, 0, [0, 0])).toThrow();
        expect(() => camera.zoom_at(start, NaN, [0, 0])).toThrow();
        expect(() => camera.pan(start, Infinity, 0)).toThrow();
        expect(() => camera.window_of(start, [0, 100])).toThrow();
        expect(() => camera.fit(start, new core.space([8, 4, 4]), [100, -1])).toThrow();
    });
});
