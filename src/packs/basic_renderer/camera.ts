import type { camera_type, view_plane } from './types';

export class camera
{
    public pan_x: number;
    public pan_y: number;
    public zoom:  number;
    public plane: view_plane;

    private readonly listeners: Set<(cam: camera) => void>;

    constructor(initial_dim: number = 3, initial_state?: Partial<camera_type>)
    {
        this.pan_x = initial_state?.pan_x ?? 0;
        this.pan_y = initial_state?.pan_y ?? 0;
        this.zoom  = initial_state?.zoom  ?? 40;
        this.plane = initial_state?.plane ?? {
            dim_h: 0,
            dim_v: 1,
            slices: new Array(Math.max(2, initial_dim)).fill(0)
        };
        this.listeners = new Set();
    }

    public notify_change(): void
    {
        for (const listener of this.listeners)
        {
            listener(this);
        }
    }

    public on_change(listener: (cam: camera) => void): () => void
    {
        this.listeners.add(listener);
        return () =>
        {
            this.listeners.delete(listener);
        };
    }

    public get_state(): camera_type
    {
        return {
            pan_x: this.pan_x,
            pan_y: this.pan_y,
            zoom:  this.zoom,
            plane: {
                dim_h:  this.plane.dim_h,
                dim_v:  this.plane.dim_v,
                slices: [...this.plane.slices]
            }
        };
    }

    public get_plane(): view_plane
    {
        return {
            dim_h:  this.plane.dim_h,
            dim_v:  this.plane.dim_v,
            slices: [...this.plane.slices]
        };
    }

    public adapt_plane(target_dim: number): void
    {
        if (target_dim <= 0)
        {
            return;
        }

        if (this.plane.dim_h < 0 || this.plane.dim_h >= target_dim)
        {
            this.plane.dim_h = 0;
        }
        if (this.plane.dim_v < 0 || this.plane.dim_v >= target_dim || this.plane.dim_v === this.plane.dim_h)
        {
            this.plane.dim_v = target_dim > 1 ? (this.plane.dim_h === 0 ? 1 : 0) : 0;
        }

        const new_slices = new Array(target_dim).fill(0);
        for (let i = 0; i < Math.min(this.plane.slices.length, target_dim); i++)
        {
            new_slices[i] = this.plane.slices[i];
        }
        this.plane.slices = new_slices;
    }
}
