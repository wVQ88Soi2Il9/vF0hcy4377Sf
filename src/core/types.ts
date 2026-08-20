/**
 * N-dimensional integer grid coordinate vector.
 * Index 0 = X, 1 = Y, 2 = Z, 3 = W, ...
 * All positions within a device are local offsets relative to `position`.
 */
export type vector = number[];

/**
 * A single 90-degree rotation step in the plane spanned by axis_a and axis_b.
 * steps: number of 90° CCW turns (0–3).
 *
 * In 3D this maps to the familiar axis rotations:
 *   axis_a=1, axis_b=2  →  rotate around X
 *   axis_a=0, axis_b=2  →  rotate around Y (CCW looking down +Y)
 *   axis_a=0, axis_b=1  →  rotate around Z
 */
export type rotation_plane =
{
    axis_a: number;
    axis_b: number;
    steps:  0 | 1 | 2 | 3;
};

/**
 * N-dimensional rotation expressed as an ordered list of plane rotations.
 * Applied left-to-right. An empty array means no rotation.
 */
export type rotation = rotation_plane[];

// ── Pack ─────────────────────────────────────────────────────────────────────

/** 
 * 代表一個從 JSON 載入的資料包 (Mod / Base Game)
 */
export interface pack
{
    id:                  string;
    items:               item_definition[];
    recipes:             recipe[];
    device_definitions:  device_definition[];
}

// ── Item ─────────────────────────────────────────────────────────────────────

export interface item_definition
{
    id:          string;
    other_info:  Record<string, unknown>;
}

export interface item_stack
{
    item_id:   string;
    quantity:  number;
}

// ── Recipe ───────────────────────────────────────────────────────────────────

export interface recipe_evaluation
{
    /** Whether this recipe is valid / compatible for the given context */
    valid:       boolean;

    /** Processing duration */
    duration:    number;

    /** Dynamic input items required */
    inputs:      item_stack[];

    /** Dynamic output items produced */
    outputs:     item_stack[];

    /** Mod-extensible evaluation metadata */
    other_info?: Record<string, unknown>;
}

/**
 * Dynamic recipe evaluation function.
 * Evaluates recipe compatibility, duration, inputs, and outputs for a given device instance UID.
 */
export type recipe_fn = (uid?: number) => recipe_evaluation;

export interface recipe
{
    id:          string;
    evaluate:    recipe_fn;
    other_info?: Record<string, unknown>;
}

// ── Device ───────────────────────────────────────────────────────────────────

// ── Device Definition (靜態藍圖 / 原型類別) ───────────────────────────────────

export interface device_definition
{
    /** Unique identifier for the device type, e.g. "assembler_mk1" */
    id:           string;

    /**
     * Cells this device occupies, as local offsets from anchor (before rotation).
     * e.g. [[0,0,0], [2,0,0]] = 1×2 horizontal device in 3D half-grid coords.
     */
    shape:        vector[];

    /**
     * Input port positions, local offsets (before rotation).
     * A port is defined as the coordinate of the ADJACENT cell it connects to.
     * Example: If device is at [0,0], a right-facing port is at [1,0].
     */
    input_ports:  vector[];

    /** 
     * Output port positions, local offsets (before rotation). 
     * Defined as the coordinate of the ADJACENT cell.
     */
    output_ports: vector[];

    /** Mod-extensible static metadata for the device blueprint. Core never reads this. */
    other_info?:   Record<string, unknown>;
}

/**
 * Base OOP class for device blueprints / definitions.
 */
export class device_definition_base implements device_definition
{
    public id:           string;
    public shape:        vector[];
    public input_ports:  vector[];
    public output_ports: vector[];
    public other_info:   Record<string, unknown>;

    constructor
    (
        id:           string,
        shape:        vector[] = [],
        input_ports:  vector[] = [],
        output_ports: vector[] = [],
        other_info:   Record<string, unknown> = {}
    )
    {
        this.id           = id;
        this.shape        = shape;
        this.input_ports  = input_ports;
        this.output_ports = output_ports;
        this.other_info   = other_info;
    }

    public get_shape(_dev?: device): vector[]
    {
        return this.shape;
    }

    public get_input_ports(_dev?: device): vector[]
    {
        return this.input_ports;
    }

    public get_output_ports(_dev?: device): vector[]
    {
        return this.output_ports;
    }

    public create_instance
    (
        uid:        number,
        position:   vector,
        rotation:   rotation = [],
        other_info: Record<string, unknown> = {}
    ): device_instance
    {
        return new device_instance(uid, this.id, position, rotation, other_info);
    }
}

// ── Device Instance (動態實體類別) ─────────────────────────────────────────

export interface device_data
{
    uid:                  number;
    definition_id:        string;
    position:             vector;
    rotation:             rotation;
    selected_recipe_id?:  string;
    other_info?:          Record<string, unknown>;
}

/**
 * OOP Device Instance class representing a placed device on the map.
 */
export class device_instance implements device_data
{
    public uid:                 number;
    public definition_id:       string;
    public position:            vector;
    public rotation:            rotation;
    public selected_recipe_id?: string;
    public other_info:          Record<string, unknown>;

    constructor
    (
        uid:                 number,
        definition_id:       string,
        position:            vector,
        rotation:            rotation = [],
        other_info:          Record<string, unknown> = {},
        selected_recipe_id?: string
    )
    {
        this.uid                = uid;
        this.definition_id      = definition_id;
        this.position           = position;
        this.rotation           = rotation;
        this.other_info         = other_info;
        this.selected_recipe_id = selected_recipe_id;
    }

    public move(new_position: vector): void
    {
        this.position = new_position;
    }

    public rotate(new_rotation: rotation): void
    {
        this.rotation = new_rotation;
    }

    public select_recipe(recipe_id?: string): void
    {
        this.selected_recipe_id = recipe_id;
    }
}

export type device = device_instance;

// ── Map ──────────────────────────────────────────────────────────────────────

export interface game_map
{
    /**
     * Grid dimensions per axis.
     * Length of this array defines N (the number of spatial dimensions).
     * Valid cells satisfy: 0 <= pos[i] < size[i] for all i.
     */
    size:            vector;

    /** Auto-increment counter for device uid generation */
    uid:             number;

    devices:         device[];
}


