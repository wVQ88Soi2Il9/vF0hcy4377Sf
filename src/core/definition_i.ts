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
 * Hook 槽位集合結構：
 * namespace -> Map<id, callback[]>
 */
export type hook_list = Map<string, Map<string, hook_callback[]>>;