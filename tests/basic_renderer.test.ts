// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import * as core from '@/core';
import * as basic_renderer from '@/packs/basic_renderer';
import * as cuboid_device from '@/packs/cuboid_device';

const def: core.namespaced_id = { namespace: 'test', id: 'box' };
const flat: basic_renderer.projection_view = { axes: [0, 1], slice: {} };

class plain_device extends core.device
{
    public get_shape(): core.vector[] { return [[0, 0]]; }
    public get_port(): core.port[] { return []; }
}

class box_device extends basic_renderer.drawable(cuboid_device.base_cuboid_device)
{
    public readonly device_size: core.vector = [2, 2];
    public get_port(): core.port[] { return []; }
    public draw(item: basic_renderer.projected_device, cell_px: number): SVGElement
    {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-color', String((this.other_info!.basic_renderer as { color: string }).color));
        g.setAttribute('data-cells', item.cells.map(c => c.join(',')).join(';'));
        g.setAttribute('data-cell_px', String(cell_px));
        return g;
    }
}

describe('basic_renderer.drawable', () =>
{
    it('mixin keeps the device constructor and other_info', () =>
    {
        const dev = new box_device('a'.repeat(16), def, [2, 4], { basic_renderer: { color: 'red' } });
        expect(dev).toBeInstanceOf(cuboid_device.base_cuboid_device);
        expect(dev.position).toEqual([2, 4]);
        expect(dev.get_shape()).toEqual([[0, 0]]);
        expect(basic_renderer.is_drawable(dev)).toBe(true);
        expect(basic_renderer.is_drawable(new plain_device('b'.repeat(16), def, [0, 0]))).toBe(false);
    });
});

describe('basic_renderer.render', () =>
{
    it('returns a layer with only drawable devices and no viewport', () =>
    {
        const dev = new box_device('a'.repeat(16), def, [0, 0], { basic_renderer: { color: 'red' } });
        const plain = new plain_device('b'.repeat(16), def, [0, 0]);
        const layer = basic_renderer.render(
        {
            size:    [8, 4],
            view:    flat,
            devices: [{ device: dev, cells: [[0, 0], [2, 0]] }, { device: plain, cells: [[4, 2]] }]
        }, 10);

        expect(layer.tagName).toBe('g');
        expect(layer.hasAttribute('viewBox')).toBe(false);
        expect(layer.getAttribute('transform')).toBe('translate(0 20) scale(1 -1)');
        expect(layer.children.length).toBe(1);
        const g = layer.children[0];
        expect(g.getAttribute('data-color')).toBe('red');
        expect(g.getAttribute('data-cells')).toBe('0,0;2,0');
        expect(g.getAttribute('data-cell_px')).toBe('10');
    });

    it('draws cells outside the size; the viewport is up to the caller', () =>
    {
        const dev = new box_device('a'.repeat(16), def, [0, 0], { basic_renderer: { color: 'red' } });
        const layer = basic_renderer.render({ size: [4, 4], view: flat, devices: [{ device: dev, cells: [[-2, 8]] }] }, 10);
        expect(layer.children[0].getAttribute('data-cells')).toBe('-2,8');
    });

    it('passes the projection view to draw', () =>
    {
        let seen: basic_renderer.projection_view | undefined;
        class view_device extends box_device
        {
            public draw(item: basic_renderer.projected_device, cell_px: number, view: basic_renderer.projection_view): SVGElement
            {
                seen = view;
                return super.draw(item, cell_px);
            }
        }
        const dev = new view_device('a'.repeat(16), def, [0, 0], { basic_renderer: { color: 'red' } });
        const view: basic_renderer.projection_view = { axes: [2, 0], slice: { 1: 3 } };
        basic_renderer.render({ size: [4, 4], view, devices: [{ device: dev, cells: [[0, 0]] }] }, 10);
        expect(seen).toBe(view);
    });

    it('throws on invalid cell_px', () =>
    {
        expect(() => basic_renderer.render({ size: [4, 4], view: flat, devices: [] }, 0)).toThrow();
        expect(() => basic_renderer.render({ size: [4, 4], view: flat, devices: [] }, Infinity)).toThrow();
    });
});

describe('basic_renderer.render overlap', () =>
{
    it('draws overlapping devices in projection order, later on top', () =>
    {
        const under = new box_device('a'.repeat(16), def, [0, 0], { basic_renderer: { color: 'red' } });
        const over = new box_device('b'.repeat(16), def, [0, 0], { basic_renderer: { color: 'blue' } });
        const svg = basic_renderer.render(
        {
            size:    [4, 4],
            view:    flat,
            devices: [{ device: under, cells: [[0, 0]] }, { device: over, cells: [[0, 0]] }]
        }, 10);
        expect([...svg.children].map(g => g.getAttribute('data-color'))).toEqual(['red', 'blue']);
    });
});
