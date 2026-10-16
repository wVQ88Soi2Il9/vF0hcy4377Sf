import * as core from '@/core';
import type { camera_view } from './project';

// 視角加上平移/縮放；由使用端保存，函式一律回傳新的 state
export interface camera_state
{
    view:   camera_view;
    // 畫面左上角對應的空間座標（兩個畫面軸）
    origin: [number, number];
    // 一個空間單位畫成幾 px
    scale:  number;
}

function check_positive(value: number, name: string): void
{
    if (!Number.isFinite(value) || value <= 0)
    {
        throw new Error(`${name} must be a finite positive number, got ${value}`);
    }
}

function check_px_size(px_size: [number, number]): void
{
    check_positive(px_size[0], 'px width');
    check_positive(px_size[1], 'px height');
}

// 拖曳 (dx_px, dy_px)：畫面內容跟著游標移動
export function pan(state: camera_state, dx_px: number, dy_px: number): camera_state
{
    if (!Number.isFinite(dx_px) || !Number.isFinite(dy_px))
    {
        throw new Error(`pan delta must be finite, got ${dx_px},${dy_px}`);
    }
    return {
        view:   state.view,
        origin: [state.origin[0] - dx_px / state.scale, state.origin[1] - dy_px / state.scale],
        scale:  state.scale
    };
}

// 以畫面上的 at_px 為中心縮放 factor 倍；at_px 底下的空間點不動
export function zoom_at(state: camera_state, factor: number, at_px: [number, number]): camera_state
{
    check_positive(factor, 'zoom factor');
    const scale = state.scale * factor;
    const anchor_x = state.origin[0] + at_px[0] / state.scale;
    const anchor_y = state.origin[1] + at_px[1] / state.scale;
    return {
        view:   state.view,
        origin: [anchor_x - at_px[0] / scale, anchor_y - at_px[1] / scale],
        scale
    };
}

// 讓整個空間（兩個畫面軸）置中塞進 px_size 的畫面
export function fit(state: camera_state, target: core.space, px_size: [number, number]): camera_state
{
    check_px_size(px_size);
    const [h, v] = state.view.axes;
    const width = target.size[h];
    const height = target.size[v];
    const scale = Math.min(px_size[0] / width, px_size[1] / height);
    return {
        view:   state.view,
        origin: [(width - px_size[0] / scale) / 2, (height - px_size[1] / scale) / 2],
        scale
    };
}

// px_size 的畫面看到的空間範圍 [x, y, w, h]
export function window_of(state: camera_state, px_size: [number, number]): [number, number, number, number]
{
    check_px_size(px_size);
    return [state.origin[0], state.origin[1], px_size[0] / state.scale, px_size[1] / state.scale];
}
