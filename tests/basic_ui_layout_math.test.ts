import { describe, it, expect } from 'vitest';
import * as basic_ui from '@/packs/basic_ui';

const lim = (min: number, max: number): basic_ui.limit => ({ min, max });

describe('basic_ui layout_math validation', () =>
{
    it('rejects bad limits and sizes', () =>
    {
        expect(() => basic_ui.check_sizes([10], [lim(NaN, 20)])).toThrow(/min/);
        expect(() => basic_ui.check_sizes([10], [lim(-1, 20)])).toThrow(/min/);
        expect(() => basic_ui.check_sizes([10], [lim(0, NaN)])).toThrow(/max/);
        expect(() => basic_ui.check_sizes([10], [lim(30, 20)])).toThrow(/max/);
        expect(() => basic_ui.check_sizes([NaN], [lim(0, 10)])).toThrow(/sizes\[0\]/);
        expect(() => basic_ui.check_sizes([30], [lim(0, 20)])).toThrow(/outside/);
        expect(() => basic_ui.check_sizes([10, 10], [lim(0, 20)])).toThrow(/entries/);
        expect(() => basic_ui.check_sizes([10], [lim(0, Infinity)])).not.toThrow();
    });

    it('rejects bad indices and delta', () =>
    {
        const sizes = [10, 10];
        const limits = [lim(0, 20), lim(0, 20)];
        expect(() => basic_ui.drag_range(sizes, limits, 1)).toThrow(/out of range/);
        expect(() => basic_ui.drag_range(sizes, limits, -1)).toThrow(/out of range/);
        expect(() => basic_ui.resize_pair(sizes, limits, 0, NaN)).toThrow(/delta/);
    });
});

describe('basic_ui layout_math drag', () =>
{
    it('drag_range is bounded by both sides', () =>
    {
        // a: 100 in [50, 150]; b: 100 in [80, 300]
        expect(basic_ui.drag_range([100, 100], [lim(50, 150), lim(80, 300)], 0)).toEqual([-50, 20]);
    });

    it('resize_pair clamps, keeps the total and does not mutate its input', () =>
    {
        const sizes = [100, 100, 40];
        const limits = [lim(50, 150), lim(80, 300), lim(0, Infinity)];
        expect(basic_ui.resize_pair(sizes, limits, 0, 10)).toEqual([110, 90, 40]);
        expect(basic_ui.resize_pair(sizes, limits, 0, 999)).toEqual([120, 80, 40]);
        expect(basic_ui.resize_pair(sizes, limits, 0, -999)).toEqual([50, 150, 40]);
        expect(basic_ui.resize_pair(sizes, limits, 1, -30)).toEqual([100, 80, 60]);
        expect(sizes).toEqual([100, 100, 40]);
    });

    it('a full drag lands exactly on the limit despite rounding', () =>
    {
        expect(basic_ui.resize_pair([0.4, 1], [lim(0.1, 100), lim(0, 100)], 0, -100)[0]).toBe(0.1);
        expect(basic_ui.resize_pair([0.3, 50], [lim(0, 0.9), lim(0, 100)], 0, 100)[0]).toBe(0.9);
    });

    it('a fixed child (min = max) blocks its separators', () =>
    {
        const limits = [lim(100, 100), lim(0, 500)];
        expect(basic_ui.drag_range([100, 200], limits, 0)).toEqual([0, 0]);
        expect(basic_ui.resize_pair([100, 200], limits, 0, 40)).toEqual([100, 200]);
    });
});
