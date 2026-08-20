/**
 * N-dimensional integer grid coordinate vector.
 * Index 0 = X, 1 = Y, 2 = Z, 3 = W, ...
 * All positions within a device are local offsets relative to `position`.
 */
export type vector = number[];

// ── Pack ─────────────────────────────────────────────────────────────────────

/** 
 * 代表一個從 JSON 載入的資料包 (Mod / Base Game)
 */
export interface pack
{
    id:       string;
    items:    item_definition[];
    recipes:  recipe[];
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

export abstract class device
{
    public readonly uid:         number;
    public definition_id:        string;
    public position:             vector;
    public selected_recipe_id?:  string;
    public other_info?:          Record<string, unknown>;

    constructor(uid: number, definition_id: string, position: vector)
    {
        this.uid = uid;
        this.definition_id = definition_id;
        this.position = position;
    }

    /** 取得局部形狀格點 (Local Coordinates) */
    public abstract get_shape(): vector[];

    /** 取得局部連接埠 (Local Coordinates) */
    public abstract get_port(type: 'input' | 'output'): vector[];
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
