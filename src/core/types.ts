/**
 * N-dimensional integer grid coordinate vector.
 * Index 0 = X, 1 = Y, 2 = Z, 3 = W, ...
 * All positions within a device are local offsets relative to `position`.
 */
export type vector = number[];

// ── Namespace & Identifier ───────────────────────────────────────────────────

/**
 * Structured namespaced resource identifier.
 */
export interface namespaced_id
{
    namespace: string;
    id:        string;
}

// ── Pack Module ──────────────────────────────────────────────────────────────

export type device_constructor = new
(
    uid:           number,
    definition_id: namespaced_id,
    position:      vector,
    other_info?:   Record<string, unknown>
) => device;

export type map_command_factory = (...args: any[]) => map_command;

/**
 * 模組命名空間物件 (Pack-as-a-Module-Object)
 */
export interface pack_module
{
    pack_id:       string;
    items?:        Record<string, item_definition>;
    recipes?:      Record<string, recipe>;
    devices?:      Record<string, device_constructor>;
    commands?:     Record<string, map_command_factory>;
    init_pack?:    () => void;
    [key: string]: unknown;
}

// ── Item ─────────────────────────────────────────────────────────────────────

export interface item_definition extends namespaced_id
{
    other_info?: Record<string, unknown>;
}

export interface item_stack
{
    item_id:   namespaced_id;
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

export interface recipe extends namespaced_id
{
    evaluate:    recipe_fn;
    other_info?: Record<string, unknown>;
}

// ── Device ───────────────────────────────────────────────────────────────────

export abstract class device
{
    public readonly uid:         number;
    public definition_id:        namespaced_id;
    public position:             vector;
    public selected_recipe_id?:  namespaced_id;
    public other_info?:          Record<string, unknown>;

    constructor(uid: number, definition_id: namespaced_id, position: vector)
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
     * Spatial dimension count N (e.g. 2 for 2D, 3 for 3D, 4 for 4D).
     * Strictly equals size.length.
     */
    readonly dimension: number;

    /**
     * Grid dimensions per axis.
     * Length of this array defines N (the number of spatial dimensions).
     * Valid cells satisfy: 0 <= pos[i] < size[i] for all i.
     */
    size:               vector;

    /** Auto-increment counter for device uid generation */
    uid:                number;

    devices:            device[];
}

// ── History (Undo / Redo) ─────────────────────────────────────────────────────

/**
 * An encapsulated, reversible map mutation.
 * `execute` applies the change; `inverse` reverts it exactly.
 *
 * Factories in API.ts close over any additional context (e.g. registry)
 * via runtime, keeping this interface free of circular dependencies with
 * `pack_manager`.
 */
export interface map_command extends namespaced_id
{
    /** Apply the change to the map. */
    execute(map: game_map): void;

    /** Revert the change to the map. Must be the exact logical inverse of execute(). */
    inverse(map: game_map): void;

    /** Optional mod-extensible metadata associated with this command instance. */
    other_info?: Record<string, unknown>;
}

/**
 * A single node in the Undo Tree.
 * The root node has `parent_uid === null` and `command === null`.
 */
export interface history_node
{
    /** Unique numeric ID of this node within the tree. */
    uid:          number;

    /**
     * Parent node UID.
     * `null` only for the root node (which represents the initial empty state).
     */
    parent_uid:   number | null;

    /**
     * UIDs of all child nodes in creation order.
     * Each child represents a diverging edit branch created after this node.
     * Redo naturally follows the latest child (children_uids.at(-1)).
     */
    children_uids: number[];

    /**
     * The command that produced this node's state from its parent's state.
     * `null` only for the root node.
     */
    command:      map_command | null;

    /**
     * Mod-extensible metadata for this history node (e.g. vanilla tags, pin, merge info).
     */
    other_info?:  Record<string, unknown>;
}

/**
 * The Undo Tree: a persistent, branching record of all map mutations.
 *
 * Invariants:
 *   - `nodes` always contains at least one entry (the root, uid = 0).
 *   - `current_uid` always refers to a key that exists in `nodes`.
 *   - `next_node_uid` is strictly increasing and never reused.
 */
export interface history_tree
{
    /** All nodes keyed by their numeric UID. */
    nodes:         Map<number, history_node>;

    /** UID of the node that represents the current map state. */
    current_uid:   number;

    /** Counter used to assign the next unique node UID. Starts at 1 (root = 0). */
    next_node_uid: number;
}
