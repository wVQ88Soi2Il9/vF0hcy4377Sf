/* they always exist */

export type vector = number[];

export interface namespaced_id
{
    pack: string;
    id:   string;
}

export type uid = number;

// ── Hooks (發布 / 訂閱) ──────────────────────────────────────────────────────
/**
 * pack-> Map:{id->Array}
 */
export type empty_hook_list = Map<string, Map<string, Array<(...args: any[]) => void>>>