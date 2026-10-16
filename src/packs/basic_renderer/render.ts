import * as core from '@/core';

const SVG_NS = 'http://www.w3.org/2000/svg';

// 已投影的 2D 視圖（裁切由呼叫端負責）；座標單位同空間（一格 = 2），以視窗左上為原點
export interface projected_device
{
    device: core.device;
    cells:  [number, number][];
}

// 投影時的視角：畫面兩軸對應的空間軸，與其餘每軸的切片位置（renderer 只轉交給 draw）
export interface projection_view
{
    // 畫面水平、垂直方向對應的空間軸
    axes:  [number, number];
    // 其餘每個軸的切片位置（空間座標，可為格面的偶數或格中心的奇數）
    slice: Record<number, number>;
}

export interface projection
{
    size:    [number, number];
    view:    projection_view;
    devices: projected_device[];
}

type abstract_ctor<T = {}> = abstract new (...args: any[]) => T;

const drawable_brand = Symbol('basic_renderer.drawable');

export interface drawable_capability
{
    draw(item: projected_device, cell_px: number, view: projection_view): SVGElement;
}

// mixin：把繪製能力疊到任何裝置類別上，不佔繼承鏈
export function drawable<B extends abstract_ctor<core.device>>(base: B)
{
    abstract class drawable_device extends base implements drawable_capability
    {
        public readonly [drawable_brand] = true;
        public abstract draw(item: projected_device, cell_px: number, view: projection_view): SVGElement;
    }
    return drawable_device;
}

export function is_drawable(target: core.device): target is core.device & drawable_capability
{
    return drawable_brand in target;
}

// 畫成一個圖層，座標為空間座標 × cell_px / 2；不設視窗，看哪一塊由使用端的 viewBox 決定
export function render(view: projection, cell_px: number): SVGGElement
{
    if (!Number.isFinite(cell_px) || cell_px <= 0)
    {
        throw new Error(`cell_px must be a finite positive number, got ${cell_px}`);
    }

    const layer = document.createElementNS(SVG_NS, 'g');
    for (const item of view.devices)
    {
        if (is_drawable(item.device))
        {
            layer.appendChild(item.device.draw(item, cell_px, view.view));
        }
    }
    return layer;
}
