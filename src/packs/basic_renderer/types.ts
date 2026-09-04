import * as core from '@/core';
import * as camera from '@/packs/camera';

/**
 * Capability interface for devices that can be rendered by basic_renderer.
 */
export interface drawable_device extends core.device
{
    draw
    (
        ctx:    CanvasRenderingContext2D,
        sx:     number,
        sy:     number,
        sw:     number,
        sh:     number,
        zoom:   number,
        camera: camera.camera_type
    ): void;
}
