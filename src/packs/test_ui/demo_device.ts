import * as core from '@/core';
import * as basic_renderer from '@/packs/basic_renderer';
import * as cuboid_device from '@/packs/cuboid_device';

const SVG_NS = 'http://www.w3.org/2000/svg';

const PORT_COLOR: Record<core.port_direction, string> =
{
    input:         '#4af',
    output:        '#fa4',
    bidirectional: '#c6f'
};

// 埠在畫面上的朝向：位於橫軸或直軸的面上（畫在格邊），或位於切片軸的面上（朝畫面內外，畫在格中心）
export type port_facing = 'h' | 'v' | 'depth';

export interface projected_port
{
    port:   core.port;
    at:     [number, number];
    facing: port_facing;
    // 面上的埠：裝置的格在面的哪一側（沿面所在軸，+1 或 -1）
    inward: 1 | -1;
}

// 依視角投影裝置的埠：切片軸上距切片 ≤ 1（碰到切片所在的格或面）才顯示
export function project_ports(dev: core.device, view: basic_renderer.projection_view): projected_port[]
{
    const [h, v] = view.axes;
    const result: projected_port[] = [];
    for (const port of dev.get_port())
    {
        const pos = port.offset.map((o, i) => o + dev.position[i]);
        const touches = Object.keys(view.slice).map(Number)
            .every(axis => Math.abs(pos[axis] - view.slice[axis]) <= 1);
        if (!touches)
        {
            continue;
        }
        const face_axis = pos.findIndex(n => n % 2 === 0);
        const facing: port_facing = face_axis === h ? 'h' : face_axis === v ? 'v' : 'depth';
        // 面的正側有本裝置的格就朝 +，否則朝 -
        const inward = dev.get_shape().some(cell => cell.every((c, axis) =>
            axis === face_axis ? c === port.offset[axis] : c <= port.offset[axis] && port.offset[axis] <= c + 2)) ? 1 : -1;
        result.push({ port, at: [pos[h], pos[v]], facing, inward });
    }
    return result;
}

// 示範用長方體裝置；顏色取自 view 設在 <svg> 上的 --test_ui_device_fill
// 埠：每軸兩端各一個（位於第一格的那一列）；第 1 軸兩面為雙向，其餘各軸負面為輸入、正面為輸出
abstract class demo_cuboid extends basic_renderer.drawable(cuboid_device.base_cuboid_device)
{
    public get_port(): core.port[]
    {
        const ports: core.port[] = [];
        for (let axis = 0; axis < this.position.length; axis++)
        {
            for (const side of [0, this.device_size[axis]])
            {
                const offset = this.position.map(() => 1);
                offset[axis] = side;
                const direction: core.port_direction = axis === 1 ? 'bidirectional' : side === 0 ? 'input' : 'output';
                ports.push({ port_uid: `d${axis}${side === 0 ? '-' : '+'}`, offset, direction });
            }
        }
        return ports;
    }

    public draw(item: basic_renderer.projected_device, cell_px: number, view: basic_renderer.projection_view): SVGElement
    {
        const g = document.createElementNS(SVG_NS, 'g');
        g.dataset.test_ui_device = this.device_uid;
        for (const [x, y] of item.cells)
        {
            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('x', String(x / 2 * cell_px + 1));
            rect.setAttribute('y', String(y / 2 * cell_px + 1));
            rect.setAttribute('width', String(cell_px - 2));
            rect.setAttribute('height', String(cell_px - 2));
            rect.style.fill = 'var(--test_ui_device_fill)';
            g.appendChild(rect);
        }

        const mark = cell_px / 4;
        for (const { port, at, facing, inward } of project_ports(this, view))
        {
            const cx = at[0] / 2 * cell_px;
            const cy = at[1] / 2 * cell_px;
            const color = PORT_COLOR[port.direction];
            let el: SVGElement;
            if (facing === 'depth')
            {
                el = document.createElementNS(SVG_NS, 'circle');
                el.setAttribute('cx', String(cx));
                el.setAttribute('cy', String(cy));
                // 朝畫面內外的輸入與輸出常疊在同一點：輸入畫成外圈，其他畫成實心
                const ring = port.direction === 'input';
                el.setAttribute('r', String(ring ? mark : mark / 2));
                el.setAttribute('fill', ring ? 'none' : color);
                if (ring)
                {
                    el.setAttribute('stroke', color);
                    el.setAttribute('stroke-width', String(mark / 3));
                }
            }
            else
            {
                // 畫在格內、貼著面
                el = document.createElementNS(SVG_NS, 'rect');
                const inside = (center: number) => inward > 0 ? center : center - mark;
                el.setAttribute('x', String(facing === 'h' ? inside(cx) : cx - mark / 2));
                el.setAttribute('y', String(facing === 'v' ? inside(cy) : cy - mark / 2));
                el.setAttribute('width', String(mark));
                el.setAttribute('height', String(mark));
                el.setAttribute('fill', color);
            }
            el.dataset.test_ui_port = port.port_uid;
            el.dataset.direction = port.direction;
            el.dataset.facing = facing;
            const title = document.createElementNS(SVG_NS, 'title');
            title.textContent = `${port.port_uid} ${port.direction}`;
            el.appendChild(title);
            g.appendChild(el);
        }
        return g;
    }
}

// 每軸一格
export class demo_box extends demo_cuboid
{
    public get device_size(): core.vector
    {
        return this.position.map(() => 2);
    }
}

// 第 0 軸兩格，其餘一格
export class demo_bar extends demo_cuboid
{
    public get device_size(): core.vector
    {
        return this.position.map((_, axis) => axis === 0 ? 4 : 2);
    }
}

// 第 0、1 軸各兩格，其餘一格
export class demo_slab extends demo_cuboid
{
    public get device_size(): core.vector
    {
        return this.position.map((_, axis) => axis < 2 ? 4 : 2);
    }
}
