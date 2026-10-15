import type { vector, namespaced_id, uid } from './definition_i';

export interface item_definition extends namespaced_id 
{
    other_info?: Record<string, unknown>;
}

export interface item_stack 
{
    item_id:  namespaced_id;
    quantity: number;
}

export type port_direction = 'input' | 'output' | 'bidirectional';

export interface port 
{
    port_uid:    uid;
    offset:      vector;
    direction:   port_direction;
    other_info?: Record<string, unknown>;
}

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
        this.position = [...position];
        this.other_info = other_info;
    }

    public abstract get_shape(): vector[];

    public abstract get_port(): port[];
}

export type device_constructor = new
(
    device_uid:    uid,
    definition_id: namespaced_id,
    position:      vector,
    other_info?:   Record<string, unknown>
) => device;

export interface recipe_output
{
    port_uid:   uid;
    item_stack: item_stack;
}

export interface recipe extends namespaced_id
{
    evaluate:    (device_uid: uid) => recipe_output[] | string;
    other_info?: Record<string, unknown>;
}

export class space
{
    public readonly dimension: number;
    public          size:      vector;
    public          devices:   Map<uid, device>;

    constructor(size: vector)
    {
        this.dimension = size.length;
        this.size = size;
        this.devices = new Map();
    }
}
