import * as core from '@/core';
import * as world from '@/world';
import { check_view } from './project';
import type { camera_view } from './project';
import type { camera_state } from './state';

// 每個 world 一份；第一次讀取時才依 space 建立預設視角
export interface camera_pack_state
{
    current?: camera_state;
}

// 新切片軸的起始位置：第一層格中心
export const default_slice = 1;

// 預設視角：畫面取第 0、1 軸，其餘軸切在 default_slice
export function default_view(target: core.space): camera_view
{
    const slice: Record<number, number> = {};
    for (let axis = 2; axis < target.dimension; axis++)
    {
        slice[axis] = default_slice;
    }
    return { axes: [0, 1], slice };
}

function pack_state_of(target_world: world.pure_world): camera_pack_state
{
    const state = target_world.pack_state.get('camera') as camera_pack_state | undefined;
    if (state === undefined)
    {
        throw new Error('camera pack is not composed into this world');
    }
    return state;
}

export function get_state(target_world: world.pure_world): camera_state
{
    const state = pack_state_of(target_world);
    state.current ??= { view: default_view(target_world.space), origin: [0, 0], scale: 1 };
    return state.current;
}

// 不合法的視角或縮放直接 throw，狀態不變；不通知任何人，畫面何時刷新由 UI 決定
export function set_state(target_world: world.pure_world, next: camera_state): void
{
    check_view(target_world.space, next.view);
    if (!Number.isFinite(next.scale) || next.scale <= 0 || !next.origin.every(Number.isFinite))
    {
        throw new Error(`camera origin must be finite and scale positive, got ${next.origin} / ${next.scale}`);
    }
    pack_state_of(target_world).current = next;
}

export function format_view(view: camera_view): string
{
    const slices = Object.keys(view.slice).map(Number).sort((a, b) => a - b).map(axis => `d${axis}=${view.slice[axis]}`);
    return ['view', `d${view.axes[0]}`, `d${view.axes[1]}`, ...slices].join(' ');
}

// view [d<h> d<v>] [d<n>=<pos>...]：省略畫面軸時沿用目前的；切片沿用目前的，新切片軸從 default_slice 開始
export function parse_view_args(target: core.space, current: camera_view, args: unknown[]): camera_view
{
    const axes: number[] = [];
    const given: Record<number, number> = {};
    for (const arg of args)
    {
        const text = String(arg);
        const axis_match = /^d(\d+)$/.exec(text);
        const slice_match = /^d(\d+)=(-?\d+)$/.exec(text);
        if (axis_match)
        {
            axes.push(Number(axis_match[1]));
        }
        else if (slice_match)
        {
            given[Number(slice_match[1])] = Number(slice_match[2]);
        }
        else
        {
            throw new Error(`view expects d<n> or d<n>=<pos>, got ${JSON.stringify(arg)}`);
        }
    }
    if (axes.length !== 0 && axes.length !== 2)
    {
        throw new Error(`view expects 0 or 2 view axes, got ${axes.length}`);
    }
    const view_axes: [number, number] = axes.length === 2 ? [axes[0], axes[1]] : current.axes;
    const slice: Record<number, number> = {};
    for (let axis = 0; axis < target.dimension; axis++)
    {
        if (!view_axes.includes(axis))
        {
            slice[axis] = axis in current.slice ? current.slice[axis] : default_slice;
        }
    }
    // 給在畫面軸上的切片也放進去，交給 check_view throw
    return { axes: view_axes, slice: { ...slice, ...given } };
}

export const view_command: core.cmd =
{
    namespace:  'camera',
    id:         'view',
    other_info: { cli: { description: 'view [d<h> d<v>] [d<n>=<pos>...] — 設定畫面軸與切片；不帶參數時顯示目前視角' } },
    execute(target_world: world.pure_world, ...args: unknown[]): string
    {
        const current = get_state(target_world);
        set_state(target_world, { ...current, view: parse_view_args(target_world.space, current.view, args) });
        return format_view(get_state(target_world).view);
    }
};
