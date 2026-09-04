import * as world from '@/world';
import * as camera from '@/packs/camera';
import { draw_grid } from './draw_grid';
import { draw_devices } from './draw_device';

export interface renderer_options
{
    canvas?: HTMLCanvasElement;
    camera?: camera.camera;
    drawer?: typeof draw_devices;
}

const world_renderers = new WeakMap<world.pure_world, Set<basic_renderer>>();

export function redraw_world(target_world: world.pure_world): void
{
    const renderers = world_renderers.get(target_world);
    if (renderers)
    {
        for (const r of renderers)
        {
            r.redraw();
        }
    }
}

export class basic_renderer
{
    public readonly target_world: world.pure_world;
    public readonly camera:       camera.camera;
    public readonly canvas:       HTMLCanvasElement;

    private drawer:              typeof draw_devices;
    private is_redraw_scheduled: boolean = false;
    private unbind_hooks:        (() => void)[] = [];

    constructor(target_world: world.pure_world, options?: renderer_options)
    {
        this.target_world = target_world;
        this.camera = options?.camera ?? camera.get_world_camera(target_world);
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

        // 註冊至世界渲染器集合
        let set = world_renderers.get(target_world);
        if (!set)
        {
            set = new Set();
            world_renderers.set(target_world, set);
        }
        set.add(this);

        this.bind_controls();
    }

    private bind_controls(): void
    {
        // 1. 相機本體異動時，自身排程重繪
        const unbind_cam = this.camera.on_change(() =>
        {
            this.redraw();
        });
        this.unbind_hooks.push(unbind_cam);

        // 2. 掛載畫布 DOM 互動監聽
        if (typeof this.canvas.addEventListener === 'function')
        {
            const unbind_ctrl = camera.setup_camera_control(this.canvas, this.camera, () => this.redraw());
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
        world_renderers.get(this.target_world)?.delete(this);
        for (const unbind of this.unbind_hooks)
        {
            unbind();
        }
        this.unbind_hooks = [];
    }
}
