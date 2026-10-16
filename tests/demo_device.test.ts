// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import * as core from '@/core';
import * as test_ui from '@/packs/test_ui';
import * as camera from '@/packs/camera';
import * as basic_renderer from '@/packs/basic_renderer';

const def: core.namespaced_id = { namespace: 'test_ui', id: 'box' };

function ports_of(projected: test_ui.projected_port[]): string[]
{
    return projected.map(p => `${p.port.port_uid}@${p.at.join(',')}:${p.facing}`);
}

describe('test_ui demo_box ports', () =>
{
    it('has two face ports per axis with valid face positions', () =>
    {
        const box = new test_ui.demo_box('a'.repeat(16), def, [2, 4, 0]);
        const ports = box.get_port();
        expect(ports.map(p => `${p.port_uid}:${p.direction}`)).toEqual(
            ['d0-:input', 'd0+:output', 'd1-:bidirectional', 'd1+:bidirectional', 'd2-:input', 'd2+:output']);
        for (const port of ports)
        {
            expect(port.offset.filter(n => n % 2 === 0)).toHaveLength(1);
        }
    });

    it('top view: side ports on cell edges, top and bottom ports facing the screen', () =>
    {
        const box = new test_ui.demo_box('a'.repeat(16), def, [2, 4, 0]);
        expect(ports_of(test_ui.project_ports(box, { axes: [0, 1], slice: { 2: 1 } }))).toEqual(
            ['d0-@2,5:h', 'd0+@4,5:h', 'd1-@3,4:v', 'd1+@3,6:v', 'd2-@3,5:depth', 'd2+@3,5:depth']);
    });

    it('side view maps the same ports onto the new axes', () =>
    {
        const box = new test_ui.demo_box('a'.repeat(16), def, [2, 4, 0]);
        expect(ports_of(test_ui.project_ports(box, { axes: [1, 2], slice: { 0: 3 } }))).toEqual(
            ['d0-@5,1:depth', 'd0+@5,1:depth', 'd1-@4,1:h', 'd1+@6,1:h', 'd2-@5,0:v', 'd2+@5,2:v']);
    });

    it('hides ports that do not touch the slice', () =>
    {
        const box = new test_ui.demo_box('a'.repeat(16), def, [0, 0, 0]);
        // 切在上表面 z=2：側面埠（z=1）與上表面埠（z=2）碰得到，底面埠 z=0 距離 2 不顯示
        expect(ports_of(test_ui.project_ports(box, { axes: [0, 1], slice: { 2: 2 } })).map(s => s.split('@')[0]))
            .toEqual(['d0-', 'd0+', 'd1-', 'd1+', 'd2+']);
        // 切在上一層中心 z=3：側面埠 z=1 距離 2，底面埠 z=0 距離 3，只剩上表面埠
        expect(ports_of(test_ui.project_ports(box, { axes: [0, 1], slice: { 2: 3 } })).map(s => s.split('@')[0]))
            .toEqual(['d2+']);
    });

    it('draws ports with direction and facing through camera and render', () =>
    {
        const target = new core.space([8, 8, 4]);
        const box = new test_ui.demo_box('a'.repeat(16), def, [2, 4, 0]);
        target.devices.set(box.device_uid, box);
        const layer = basic_renderer.render(camera.project(target, { axes: [0, 1], slice: { 2: 1 } }), 16);
        const marks = [...layer.querySelectorAll<SVGElement>('[data-test_ui_port]')];
        expect(marks.map(m => `${m.dataset.test_ui_port}:${m.dataset.direction}:${m.dataset.facing}:${m.tagName}`)).toEqual([
            'd0-:input:h:rect', 'd0+:output:h:rect', 'd1-:bidirectional:v:rect', 'd1+:bidirectional:v:rect',
            'd2-:input:depth:circle', 'd2+:output:depth:circle']);
        // d0- 在 (2,5) → 畫面 (16,40)，標記 4×4 往 + 畫進格內；d0+ 在 (4,5) → (32,40) 往 - 畫；d1- 在 (3,4) 往 + 畫
        expect([marks[0].getAttribute('x'), marks[0].getAttribute('y')]).toEqual(['16', '38']);
        expect([marks[1].getAttribute('x'), marks[1].getAttribute('y')]).toEqual(['28', '38']);
        expect([marks[2].getAttribute('x'), marks[2].getAttribute('y')]).toEqual(['22', '32']);
        expect(marks[4].getAttribute('fill')).toBe('none');
    });
});

describe('test_ui demo bar and slab', () =>
{
    it('span more cells and put the positive ports at the far face', () =>
    {
        const bar = new test_ui.demo_bar('a'.repeat(16), def, [0, 0, 0]);
        const slab = new test_ui.demo_slab('b'.repeat(16), def, [0, 0, 0]);
        expect(bar.get_shape()).toEqual([[0, 0, 0], [2, 0, 0]]);
        expect(slab.get_shape()).toHaveLength(4);
        const offset = (dev: core.device, uid: string) => dev.get_port().find(p => p.port_uid === uid)!.offset;
        expect(offset(bar, 'd0+')).toEqual([4, 1, 1]);
        expect(offset(bar, 'd1+')).toEqual([1, 2, 1]);
        expect(offset(slab, 'd1+')).toEqual([1, 4, 1]);
        const inward = (dev: core.device) => test_ui.project_ports(dev, { axes: [0, 1], slice: { 2: 1 } })
            .filter(p => p.facing !== 'depth').map(p => `${p.port.port_uid}${p.inward}`);
        expect(inward(bar)).toEqual(['d0-1', 'd0+-1', 'd1-1', 'd1+-1']);
    });
});
