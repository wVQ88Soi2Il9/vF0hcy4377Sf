import * as core from '@/core';
import * as basic_renderer from '@/packs/basic_renderer';
import type { camera_args } from './types';
import { project } from './projection';

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
