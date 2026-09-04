/**
 * src/packs/camera/render.ts — 相機渲染 Pipeline 主入口
 */

import * as core from '@/core';
import * as basic_renderer from '@/packs/basic_renderer';
import type { camera_args } from './types';
import { project } from './projection';

/**
 * 相機渲染主入口：將空間依切片投影後，直接調用 basic_renderer 產出視口 DOM。
 */
export function render
(
    sp:       core.space,
    args:     camera_args,
    options?: basic_renderer.render_options
): HTMLElement
{
    const proj = project(sp, args);
    return basic_renderer.render(proj, options);
}
