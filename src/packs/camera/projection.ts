/**
 * src/packs/camera/projection.ts — 空間向 2D 平面的切片投影運算
 */

import * as core from '@/core';
import * as basic_renderer from '@/packs/basic_renderer';
import type { camera_args } from './types';

/**
 * 依據指定的投影雙軸與各高維切片座標，將空間投影為 2D 視圖資料。
 * 遵循「接觸即傳」原則：只要裝置有任一單元格接觸切片即透通傳遞至 projection.devices。
 */
export function project(sp: core.space, args: camera_args): basic_renderer.projection
{
    const visible_devices: core.device[] = [];
    const slice_entries = Object.entries(args.slices).map(([axis_str, slice_val]) =>
    {
        return [Number(axis_str), slice_val] as const;
    });

    for (const dev of sp.devices)
    {
        const shapes = dev.get_shape();
        let touches = false;

        for (const cell of shapes)
        {
            let cell_touches = true;
            for (const [axis, slice_val] of slice_entries)
            {
                const cell_coord = dev.position[axis] + cell[axis];
                if (slice_val < cell_coord || slice_val >= cell_coord + 2)
                {
                    cell_touches = false;
                    break;
                }
            }

            if (cell_touches)
            {
                touches = true;
                break;
            }
        }

        if (touches)
        {
            visible_devices.push(dev);
        }
    }

    return {
        size: [sp.size[args.axes[0]], sp.size[args.axes[1]]],
        devices: visible_devices,
        other_info:
        {
            axes: args.axes,
            slices: args.slices,
            ...args.other_info
        }
    };
}
