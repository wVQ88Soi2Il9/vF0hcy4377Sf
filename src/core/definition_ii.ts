import type { vector, namespaced_id, uid } from './definition_i';

// ── Items ────────────────────────────────────────────────────────────────────

export interface item_definition extends namespaced_id 
{
    other_info?: Record<string, any>;
}

export interface item_stack 
{
    item_id:  namespaced_id;
    quantity: number;
}

// ── Ports ────────────────────────────────────────────────────────────────────

export type port_direction = 'input' | 'output' | 'bidirectional';

export interface port 
{
    /** Local UID */
    port_uid:    uid;
    offset:      vector;
    direction:   port_direction;
    other_info?: Record<string, any>;
}

// ── Devices ──────────────────────────────────────────────────────────────────

export abstract class device 
{
    public readonly device_uid:         uid;
    public          definition_id:      namespaced_id;
    public          position:           vector;
    public          selected_recipe_id?: namespaced_id;
    public          other_info?:        Record<string, unknown>;

    constructor(device_uid: uid, definition_id: namespaced_id, position: vector, other_info: Record<string, unknown> = {}) 
    {
        this.device_uid = device_uid;
        this.definition_id = definition_id;
        this.position = position;
        this.other_info = other_info;
    }

    /** Local shape cells (local coordinates) */
    public abstract get_shape(): vector[];

    /** Local ports */
    public abstract get_port(): port[];
}

export type device_constructor = new
(
    device_uid:    uid,
    definition_id: namespaced_id,
    position:      vector,
    other_info?:   Record<string, unknown>
) => device;

// ── Recipes ──────────────────────────────────────────────────────────────────

/**
 * Output item stack on a single port.
 * Recipes only specify outputs; inputs are part of the context (what the device currently receives),
 * not declared or computed by recipes, even if the device holds input inventory.
 */
export interface recipe_output
{
    port_uid:   uid;
    item_stack: item_stack;
}

/**
 * // TODO: Error message format and context/device_uid evaluation mechanism TBD
 */
export interface recipe extends namespaced_id
{
    evaluate:    (device_uid: uid) => recipe_output[] | string;
    other_info?: Record<string, any>;
}

// ── Space ────────────────────────────────────────────────────────────────────

export class space
{
    public readonly dimension:       number;
    public          size:            vector;
    public          next_device_uid: uid;
    public          devices:         device[];

    constructor(size: vector)
    {
        this.dimension = size.length;
        this.size = size;
        this.next_device_uid = 1;
        this.devices = [];
    }
}
