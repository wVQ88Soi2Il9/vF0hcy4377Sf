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
 * 代表一個從模組載入的資料包 (Mod / Base Game)
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

/**
 * Base OOP class for recipes.
 * Packs can extend recipe_base to provide custom dynamic evaluation logic.
 */
export class recipe_base implements recipe
{
    constructor
    (
        public id:         string,
        public other_info: Record<string, unknown> = {}
    )
    {
    }

    public evaluate(_uid?: number): recipe_evaluation
    {
        return {
            valid:      true,
            duration:   1,
            inputs:     [],
            outputs:    [],
            other_info: this.other_info
        };
    }
}

// ── Device ───────────────────────────────────────────────────────────────────

export interface device_definition
{
    id:           string;
    shape:        vector[];
    input_ports:  vector[];
    output_ports: vector[];
    other_info?:  Record<string, unknown>;
}

/**
 * Base OOP class for device blueprints / definitions.
 */
export class device_definition_base implements device_definition
{
    constructor
    (
        public id:           string,
        public shape:        vector[] = [],
        public input_ports:  vector[] = [],
        public output_ports: vector[] = [],
        public other_info:   Record<string, unknown> = {}
    )
    {
    }
}

/**
 * OOP Device class representing a placed device on the map.
 */
export class device
{
    constructor
    (
        public uid:                 number,
        public definition_id:       string,
        public position:            vector,
        public rotation:            rotation = [],
        public other_info:          Record<string, unknown> = {},
        public selected_recipe_id?: string
    )
    {
    }
}

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
