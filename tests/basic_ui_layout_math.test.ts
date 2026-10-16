import { describe, it, expect } from 'vitest';
import * as basic_ui from '@/packs/basic_ui';

const lim = (min: number, max: number): basic_ui.limit => ({ min, max });
const total = (sizes: number[]) => sizes.reduce((a, b) => a + b, 0);

function expect_close(actual: number[], expected: number[]): void
{
    expect(actual.length).toBe(expected.length);
    actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 9));
}

// 嚴格檢查：輸出必須能直接再交給下一個函式
function expect_within(sizes: number[], limits: basic_ui.limit[]): void
{
    expect(() => basic_ui.check_sizes(sizes, limits)).not.toThrow();
}

describe('basic_ui layout_math validation', () =>
{
    it('rejects bad limits and sizes', () =>
    {
        expect(() => basic_ui.check_sizes([10], [lim(NaN, 20)])).toThrow(/min/);
        expect(() => basic_ui.check_sizes([10], [lim(-1, 20)])).toThrow(/min/);
        expect(() => basic_ui.check_sizes([10], [lim(0, NaN)])).toThrow(/max/);
        expect(() => basic_ui.check_sizes([10], [lim(30, 20)])).toThrow(/max/);
        expect(() => basic_ui.check_sizes([Infinity], [lim(0, Infinity)])).toThrow(/sizes\[0\]/);
        expect(() => basic_ui.check_sizes([NaN], [lim(0, 10)])).toThrow(/sizes\[0\]/);
        expect(() => basic_ui.check_sizes([30], [lim(0, 20)])).toThrow(/outside/);
        expect(() => basic_ui.check_sizes([10, 10], [lim(0, 20)])).toThrow(/entries/);
        expect(() => basic_ui.check_sizes([10], [lim(0, Infinity)])).not.toThrow();
    });

    it('rejects bad indices, delta, weights, total and target', () =>
    {
        const sizes = [10, 10];
        const limits = [lim(0, 20), lim(0, 20)];
        expect(() => basic_ui.drag_range(sizes, limits, 1)).toThrow(/out of range/);
        expect(() => basic_ui.drag_range(sizes, limits, -1)).toThrow(/out of range/);
        expect(() => basic_ui.drag_range(sizes, limits, 0.5)).toThrow(/out of range/);
        expect(() => basic_ui.drag_range([10], [lim(0, 20)], 0)).toThrow(/out of range/);
        expect(() => basic_ui.resize_pair(sizes, limits, 0, NaN)).toThrow(/delta/);
        expect(() => basic_ui.resize_pair(sizes, limits, 0, Infinity)).toThrow(/delta/);
        expect(() => basic_ui.distribute(sizes, limits, -1)).toThrow(/total/);
        expect(() => basic_ui.distribute(sizes, limits, NaN)).toThrow(/total/);
        expect(() => basic_ui.distribute([1, -1], limits, 10)).toThrow(/weights\[1\]/);
        expect(() => basic_ui.distribute([1, Infinity], limits, 10)).toThrow(/weights\[1\]/);
        expect(() => basic_ui.distribute([1], limits, 10)).toThrow(/entries/);
        expect(() => basic_ui.set_child_size(sizes, limits, 2, 5, 20)).toThrow(/out of range/);
        expect(() => basic_ui.set_child_size(sizes, limits, 0, NaN, 20)).toThrow(/target/);
        expect(() => basic_ui.set_child_size(sizes, limits, 0, 5, Infinity)).toThrow(/total/);
    });

    it('does not mutate its inputs', () =>
    {
        const sizes = [100, 100];
        const limits = [lim(0, 300), lim(0, 300)];
        basic_ui.resize_pair(sizes, limits, 0, 50);
        basic_ui.distribute(sizes, limits, 400);
        basic_ui.set_child_size(sizes, limits, 0, 10, 200);
        expect(sizes).toEqual([100, 100]);
    });
});

describe('basic_ui layout_math drag', () =>
{
    it('drag_range is bounded by both sides', () =>
    {
        // a: 100 in [50, 150]; b: 100 in [80, 300]
        expect(basic_ui.drag_range([100, 100], [lim(50, 150), lim(80, 300)], 0)).toEqual([-50, 20]);
    });

    it('resize_pair clamps and keeps the total', () =>
    {
        const limits = [lim(50, 150), lim(80, 300), lim(0, Infinity)];
        expect(basic_ui.resize_pair([100, 100, 40], limits, 0, 10)).toEqual([110, 90, 40]);
        expect(basic_ui.resize_pair([100, 100, 40], limits, 0, 999)).toEqual([120, 80, 40]);
        expect(basic_ui.resize_pair([100, 100, 40], limits, 0, -999)).toEqual([50, 150, 40]);
        expect(basic_ui.resize_pair([100, 100, 40], limits, 1, -30)).toEqual([100, 80, 60]);
    });

    it('a full drag lands exactly on the limit despite rounding', () =>
    {
        const low = [lim(0.1, 100), lim(0, 100)];
        const a = basic_ui.resize_pair([0.4, 1], low, 0, -100);
        expect(a[0]).toBe(0.1);
        expect_within(a, low);
        expect(() => basic_ui.drag_range(a, low, 0)).not.toThrow();

        const high = [lim(0, 0.9), lim(0, 100)];
        const b = basic_ui.resize_pair([0.3, 50], high, 0, 100);
        expect(b[0]).toBe(0.9);
        expect_within(b, high);
    });

    it('a fixed child (min = max) blocks its separators', () =>
    {
        const limits = [lim(100, 100), lim(0, 500)];
        expect(basic_ui.drag_range([100, 200], limits, 0)).toEqual([0, 0]);
        expect(basic_ui.resize_pair([100, 200], limits, 0, 40)).toEqual([100, 200]);
    });
});

describe('basic_ui layout_math distribute', () =>
{
    it('scales by the weights when nothing hits a limit', () =>
    {
        const limits = [lim(0, Infinity), lim(0, Infinity)];
        expect(basic_ui.distribute([100, 300], limits, 800)).toEqual([200, 600]);
        expect(basic_ui.distribute([1, 3], limits, 200)).toEqual([50, 150]);
    });

    it('fixes children at their limits and gives the rest to the others', () =>
    {
        const limits = [lim(0, 150), lim(0, Infinity), lim(0, Infinity)];
        const grown = basic_ui.distribute([100, 100, 200], limits, 800);
        expect(grown[0]).toBe(150);
        expect(grown[1]).toBeCloseTo(650 / 3);
        expect(grown[2]).toBeCloseTo(1300 / 3);
        expect(total(grown)).toBeCloseTo(800);
        expect_within(grown, limits);

        const shrink_limits = [lim(90, 500), lim(0, 500), lim(0, 500)];
        const shrunk = basic_ui.distribute([100, 100, 200], shrink_limits, 200);
        expect(shrunk[0]).toBe(90);
        expect(total(shrunk)).toBeCloseTo(200);
        expect_within(shrunk, shrink_limits);
    });

    it('handles a min and a max violated at the same time', () =>
    {
        // proportional would give [10, 490]: child 0 under its min, child 1 over its max
        const limits = [lim(100, 500), lim(0, 300)];
        expect_close(basic_ui.distribute([1, 49], limits, 500), [200, 300]);
    });

    it('cascades when fixing one child pushes another over', () =>
    {
        const limits = [lim(0, 110), lim(0, 230), lim(0, Infinity)];
        const out = basic_ui.distribute([100, 200, 100], limits, 600);
        expect(out[0]).toBe(110);
        expect(out[1]).toBe(230);
        expect(out[2]).toBeCloseTo(260);
    });

    it('recovers the proportions after the container shrinks and grows back', () =>
    {
        const weights = [100, 300];
        const limits = [lim(90, Infinity), lim(0, Infinity)];
        expect_close(basic_ui.distribute(weights, limits, 200), [90, 110]);
        expect(basic_ui.distribute(weights, limits, 400)).toEqual([100, 300]);
        const both = [lim(50, Infinity), lim(50, Infinity)];
        expect(basic_ui.distribute(weights, both, 50)).toEqual([50, 50]);
        expect(basic_ui.distribute(weights, both, 400)).toEqual([100, 300]);
    });

    it('overflows at the minimums and leaves space at the maximums', () =>
    {
        const limits = [lim(100, 200), lim(50, 100)];
        expect(basic_ui.distribute([150, 75], limits, 100)).toEqual([100, 50]);
        expect(basic_ui.distribute([150, 75], limits, 150)).toEqual([100, 50]);
        expect(basic_ui.distribute([150, 75], limits, 1000)).toEqual([200, 100]);
    });

    it('zero weights stay at min until the others are full', () =>
    {
        const limits = [lim(0, Infinity), lim(10, 200), lim(0, 100)];
        expect(basic_ui.distribute([0, 1, 1], limits, 200)).toEqual([0, 100, 100]);
        expect(basic_ui.distribute([0, 1, 1], limits, 500)).toEqual([200, 200, 100]);
        const all_zero = [lim(0, Infinity), lim(0, Infinity), lim(0, 20)];
        const out = basic_ui.distribute([0, 0, 0], all_zero, 300);
        expect(out[2]).toBe(20);
        expect(out[0]).toBeCloseTo(140);
        expect(out[1]).toBeCloseTo(140);
    });

    it('keeps sizes strictly within limits on random inputs', () =>
    {
        let seed = 7;
        const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        for (let n = 0; n < 500; n++)
        {
            const count = 1 + Math.floor(rand() * 5);
            const limits: basic_ui.limit[] = [];
            const weights: number[] = [];
            for (let i = 0; i < count; i++)
            {
                const min = rand() * 100;
                const max = rand() < 0.2 ? Infinity : min + rand() * 300;
                limits.push(lim(min, max));
                weights.push(rand() < 0.1 ? 0 : rand() * 300);
            }
            const t = rand() * 1500;
            const out = basic_ui.distribute(weights, limits, t);
            expect_within(out, limits);
            const min_sum = total(limits.map(l => l.min));
            const max_sum = total(limits.map(l => l.max));
            if (t > min_sum && t < max_sum)
            {
                expect(total(out)).toBeCloseTo(t, 6);
            }
            if (count > 1)
            {
                expect_within(basic_ui.resize_pair(out, limits, 0, (rand() - 0.5) * 1000), limits);
            }
        }
    });
});

describe('basic_ui layout_math set_child_size', () =>
{
    it('collapses a child below its old min and gives the space to the others', () =>
    {
        // the child normally lives in [100, 400]; collapsed, its limits become [20, 20]
        const limits = [lim(20, 20), lim(0, Infinity), lim(0, Infinity)];
        const out = basic_ui.set_child_size([200, 100, 300], limits, 0, 20, 600);
        expect(out[0]).toBe(20);
        expect(total(out)).toBeCloseTo(600);
        expect(out[1] / out[2]).toBeCloseTo(1 / 3);
    });

    it('round-trips collapse and expand', () =>
    {
        const normal = [lim(50, 400), lim(100, 500), lim(100, 500)];
        const collapsed = [lim(20, 20), normal[1], normal[2]];
        const c = basic_ui.set_child_size([200, 150, 250], collapsed, 0, 20, 600);
        expect_within(c, collapsed);
        const e = basic_ui.set_child_size(c, normal, 0, 200, 600);
        expect(e[0]).toBe(200);
        expect(e[1]).toBeCloseTo(150);
        expect(e[2]).toBeCloseTo(250);
    });

    it('expands back but never takes more than the others can give', () =>
    {
        const limits = [lim(50, 400), lim(100, 500), lim(100, 500)];
        expect(basic_ui.set_child_size([20, 290, 290], limits, 0, 300, 600)).toEqual([300, 150, 150]);
        expect(basic_ui.set_child_size([20, 290, 290], limits, 0, 450, 600)).toEqual([400, 100, 100]);
    });

    it('uses the container total, not the current sum, with blank space', () =>
    {
        const normal = [lim(50, 300), lim(0, 300)];
        const c = basic_ui.set_child_size([300, 300], [lim(20, 20), normal[1]], 0, 20, 1000);
        expect(c).toEqual([20, 300]);
        expect(basic_ui.set_child_size(c, normal, 0, 300, 1000)).toEqual([300, 300]);
    });

    it('uses the container total, not the current sum, when overflowing', () =>
    {
        const normal = [lim(100, 500), lim(100, 500), lim(100, 500)];
        const collapsed = [lim(20, 20), normal[1], normal[2]];
        expect_close(basic_ui.set_child_size([100, 100, 100], collapsed, 0, 20, 250), [20, 115, 115]);
        // even the minimums do not fit: everyone at min
        expect(basic_ui.set_child_size([100, 100, 100], normal, 0, 300, 250)).toEqual([100, 100, 100]);
    });

    it('a single child fills the container within its limits', () =>
    {
        expect(basic_ui.set_child_size([20], [lim(50, 400)], 0, 300, 1000)).toEqual([400]);
        expect(basic_ui.set_child_size([20], [lim(50, 400)], 0, 300, 120)).toEqual([120]);
        expect(basic_ui.set_child_size([20], [lim(50, 400)], 0, 300, 10)).toEqual([50]);
    });
});
