/* they always exist */

export type vector = number[];

export interface namespaced_id
{
    namespace: string;
    id:        string;
}

export type uid = number;

// ── Hooks (發布 / 訂閱) ──────────────────────────────────────────────────────

export type hook_callback = (...args: any[]) => void;

/**
 * pack -> Map: { id -> Array }
 */
export type hook_list = Map<string, Map<string, hook_callback[]>>;