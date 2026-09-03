import * as world from '@/world';
import type { camera_type } from './types';
import { camera } from './camera';
import { draw_grid } from './draw_grid';
import { draw_devices } from './draw_device';
import { setup_camera_control } from './camera_control';

export interface renderer_options
{
    canvas?: HTMLCanvasElement;
    camera?: camera;
    drawer?: typeof draw_devices;
}

export class basic_renderer
{
    public readonly target_world: world.pure_world;
    public readonly camera:       camera;
    public readonly canvas:       HTMLCanvasElement;

    private drawer:              typeof draw_devices;
    private is_redraw_scheduled: boolean = false;
    private unbind_hooks:        (() => void)[] = [];

    constructor(target_world: world.pure_world, options?: renderer_options)
    {
        this.target_world = target_world;
        this.camera = options?.camera ?? new camera(target_world.space.dimension);
        this.drawer = options?.drawer ?? draw_devices;

        if (options?.canvas)
        {
            this.canvas = options.canvas;
        }
        else if (typeof document !== 'undefined')
        {
            this.canvas = document.createElement('canvas');
            this.canvas.id = `renderer_canvas_${target_world.id}`;
            this.canvas.width = typeof window !== 'undefined' ? window.innerWidth : 800;
            this.canvas.height = typeof window !== 'undefined' ? window.innerHeight : 600;
            this.canvas.style.cssText = 'display:block;width:100%;height:100%;';
        }
        else
        {
            this.canvas = {} as HTMLCanvasElement;
        }

        this.camera.adapt_plane(this.target_world.space.dimension);
        this.bind_events();
    }

    private bind_events(): void
    {
        // 1. 世界裝置異動重繪
        const unbind_device = this.target_world.inject_hook(
            { namespace: 'vanilla_alpha', id: 'device_change' },
            () => this.redraw()
        );
        this.unbind_hooks.push(unbind_device);

        // 2. 世界歷史異動重繪
        const unbind_history = this.target_world.inject_hook(
            { namespace: 'vanilla_alpha', id: 'history_change' },
            () => this.redraw()
        );
        this.unbind_hooks.push(unbind_history);

        // 3. 相機變更重繪，並向世界廣播 camera_change
        const unbind_cam = this.camera.on_change((cam) =>
        {
            this.redraw();
            this.target_world.trigger({ namespace: 'basic_renderer', id: 'camera_change' }, cam);
        });
        this.unbind_hooks.push(unbind_cam);

        // 4. 若畫布支援 DOM 事件監聽，掛載相機控制器
        if (typeof this.canvas.addEventListener === 'function')
        {
            const unbind_ctrl = setup_camera_control(this.canvas, this.camera, () => this.redraw());
            this.unbind_hooks.push(unbind_ctrl);
        }
    }

    public set_device_drawer(fn: typeof draw_devices): void
    {
        this.drawer = fn;
        this.redraw();
    }

    public resize(width: number, height: number): void
    {
        if (width <= 0 || height <= 0)
        {
            return;
        }
        if (this.canvas.width === width && this.canvas.height === height)
        {
            return;
        }
        this.canvas.width = width;
        this.canvas.height = height;
        this.draw();
    }

    public draw(): void
    {
        if (typeof this.canvas.getContext !== 'function')
        {
            return;
        }
        const ctx = this.canvas.getContext('2d');
        if (!ctx)
        {
            return;
        }

        this.camera.adapt_plane(this.target_world.space.dimension);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        draw_grid(ctx, this.canvas, this.camera.get_state(), this.target_world.space);
        this.drawer(ctx, this.target_world.space, this.camera.get_state(), this.canvas);
    }

    public redraw(): void
    {
        if (this.is_redraw_scheduled)
        {
            return;
        }
        this.is_redraw_scheduled = true;

        if (typeof requestAnimationFrame === 'function')
        {
            requestAnimationFrame(() =>
            {
                this.is_redraw_scheduled = false;
                this.draw();
            });
        }
        else
        {
            queueMicrotask(() =>
            {
                this.is_redraw_scheduled = false;
                this.draw();
            });
        }
    }

    public destroy(): void
    {
        for (const unbind of this.unbind_hooks)
        {
            unbind();
        }
        this.unbind_hooks = [];
    }
}

/**
 * Maps an N-dimensional world grid position to a 2-D canvas position.
 */
export function grid_to_screen
(
    pos:           number[],
    cam:           camera_type | camera,
    canvas_height: number
)
{
    const plane = cam instanceof camera ? cam.plane : cam.plane;
    const pan_x = cam.pan_x;
    const pan_y = cam.pan_y;
    const zoom  = cam.zoom;

    const h = pos[plane.dim_h];
    const v = pos[plane.dim_v];

    const sx = pan_x + h * zoom;
    const sy = canvas_height + pan_y - v * zoom;
    return { sx, sy };
}
