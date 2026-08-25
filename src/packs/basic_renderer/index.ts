import * as camera_mod from './camera';
import * as camera_control_mod from './camera_control';
import * as renderer_mod from './renderer';

export * from './types';
export * from './camera';
export * from './camera_control';
export * from './renderer';

export const basic_renderer = {
    pack_id:              'basic_renderer',
    // Canvas & Redraw
    get_canvas:           renderer_mod.get_renderer_canvas,
    resize_canvas:        renderer_mod.resize_renderer_canvas,
    redraw:               renderer_mod.redraw_renderer,
    set_device_drawer:    renderer_mod.set_device_drawer,

    // Camera & Viewport
    get_camera:           camera_mod.get_camera_plane,
    get_camera_state:     camera_mod.get_camera_state,
    set_camera:           camera_control_mod.set_camera_plane,
    set_camera_pan:       camera_control_mod.set_camera_pan,
    set_camera_zoom:      camera_control_mod.set_camera_zoom,
    set_camera_transform: camera_control_mod.set_camera_transform,
    on_camera_change:     camera_mod.on_camera_change,
    grid_to_screen:       renderer_mod.grid_to_screen
};

/**
 * Standard pack entry point called by pack loader.
 */
export function init_pack(): void
{
    renderer_mod.init_renderer();
}
