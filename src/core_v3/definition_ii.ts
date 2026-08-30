/** what is a world */

import type { vector, namespaced_id, uid } from './definition_i';

// ── Items ────────────────────────────────────────────────────────────────────

export interface item_definition extends namespaced_id 
{
    other_info?: Record<string, unknown>;
}

export interface item_stack 
{
    item_id: namespaced_id;
    quantity: number;
}

// Port

export type port_direction = 'input' | 'output' | 'bidirectional';

export interface port 
{
    /** local uid*/
    port_uid:       uid;
    offset:         vector;
    direction:      port_direction;
    other_info?:    Record<string, unknown>;
}

// ── Devices ──────────────────────────────────────────────────────────────────

/**
 * 裝置抽象基類：提供座標錨點、局部形狀 (Shape) 與連接埠 (Port) 的多型介面。
 */
export abstract class device 
{
    public readonly device_uid: uid;
    public definition_id: namespaced_id;
    public position: vector;
    public selected_recipe_id?: namespaced_id;
    public other_info?: Record<string, unknown>;

    constructor(device_uid: uid, definition_id: namespaced_id, position: vector, other_info: Record<string, unknown> = {}) 
    {
        this.device_uid = device_uid;
        this.definition_id = definition_id;
        this.position = position;
        this.other_info = other_info;
    }

    /** Local Position */
    public abstract get_shape():    vector[];
    public abstract get_port():     port[];
}

export type device_constructor = new
    (
        device_uid: uid,
        definition_id: namespaced_id,
        position: vector,
        other_info?: Record<string, unknown>
    ) => device;


// ── Recipes ──────────────────────────────────────────────────────────────────

/**
 * 單一 port 上的輸出物品堆疊。
 * recipe 只描述輸出——input 是 context 的一部分（device 目前收到什麼），
 * 不由 recipe 宣告或計算，即便 device 被迫持有 input 庫存也一樣。
 */
export interface recipe_output
{
    port_uid:   uid;
    item_stack: item_stack;
}

/**
 * ⚠️ string用來放error msg, 具體怎麼做還不確定 別用
 */
export interface recipe extends namespaced_id
{
    evaluate: (device_uid: uid) => recipe_output[] | string;
    other_info?: Record<string, unknown>;
}


// ── Space ────────────────────────────────────────────────────────────────────

/**
 * 空間實體類別：封裝 N 維幾何維度、網格大小、UID 計數器與裝置實體集合。
 */
export class space {
    public readonly dimension:  number;
    public size:                vector;
    public next_device_uid:     uid;
    public devices:             device[];

    constructor(size: vector) {
        this.dimension = size.length;
        this.size = size;
        this.next_device_uid = 1;
        this.devices = [];
    }
}
