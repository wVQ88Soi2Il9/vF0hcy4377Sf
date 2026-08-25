import { device, type vector, type namespaced_id } from '@/core';
import type { camera_type } from '@/packs/basic_renderer';
import type
{
    vector_3d,
    d4_transform,
    rotatable_device,
    drawable_layered_device
} from './types';
import { apply_d4_point, apply_d4_cell_anchor, normalize_rotation, is_vector_3d } from './math';

/**
 * Abstract base class for all 2.5D layered devices.
 * Automatically handles D4 dihedral group rotation and flip transformations for shapes and ports,
 * enforces strict 3D vector [x, y, z] length, while leaving visual draw() implementation
 * completely to downstream devices.
 */
export abstract class base_layered_device extends device implements drawable_layered_device, rotatable_device
{
    public transform: d4_transform = { rotation: 0, flipped: false };

    /** Base local shape cells (at rotation = 0, flipped = false) */
    protected abstract readonly base_shape: vector_3d[];

    /** Base local input port coordinates (at rotation = 0, flipped = false) */
    protected abstract readonly base_input_ports: vector_3d[];

    /** Base local output port coordinates (at rotation = 0, flipped = false) */
    protected abstract readonly base_output_ports: vector_3d[];

    constructor(uid: number, definition_id: namespaced_id, position: vector)
    {
        if (!is_vector_3d(position))
        {
            throw new Error(`[layered_2d] Invalid device position: expected 3-element [x, y, z] vector, got ${JSON.stringify(position)}`);
        }
        super(uid, definition_id, position);
    }

    /**
     * Returns the elevation layer index (z coordinate).
     */
    public get_layer(): number
    {
        return this.position[2];
    }

    /**
     * Computes the D4-transformed local shape cells (using cell anchor transformation).
     */
    public get_shape(): vector_3d[]
    {
        if (!this.base_shape)
        {
            return [];
        }
        return this.base_shape.map(v => apply_d4_cell_anchor(v, this.transform));
    }

    /**
     * Computes the D4-transformed local port coordinates (using direct point transformation).
     */
    public get_port(type: 'input' | 'output'): vector_3d[]
    {
        const ports = type === 'input' ? this.base_input_ports : this.base_output_ports;
        if (!ports)
        {
            return [];
        }
        return ports.map(v => apply_d4_point(v, this.transform));
    }

    /**
     * Rotates device by `steps` 90° counter-clockwise increments.
     */
    public rotate(steps: number = 1): void
    {
        this.transform.rotation = normalize_rotation(this.transform.rotation + steps);
    }

    /**
     * Flips device across the horizontal axis (y -> -y).
     */
    public flip(): void
    {
        this.transform.flipped = !this.transform.flipped;
    }

    /**
     * Sets the full D4 transformation state directly.
     */
    public set_transform(transform: d4_transform): void
    {
        this.transform = {
            rotation: normalize_rotation(transform.rotation),
            flipped:  Boolean(transform.flipped)
        };
    }

    /**
     * Visual rendering method defined by downstream devices.
     */
    public abstract draw
    (
        ctx:    CanvasRenderingContext2D,
        sx:     number,
        sy:     number,
        sw:     number,
        sh:     number,
        zoom:   number,
        camera: camera_type
    ): void;
}
