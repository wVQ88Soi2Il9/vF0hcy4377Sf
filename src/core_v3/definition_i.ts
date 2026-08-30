/**
 * N 維整數網格座標向量。
 * Index 0 = X, 1 = Y, 2 = Z, 3 = W, ...
 */
export type vector = number[];

/**
 * 結構化命名空間識別碼。
 */
export interface namespaced_id
{
    pack: string;
    id:   string;
}

export type uid = number;

// ── Hooks (發布 / 訂閱) ──────────────────────────────────────────────────────

export type unsubscribe_function = () => void;

const _subscribers = new Map<string, Set<(...args: any[]) => void>>();

/**
 * 訂閱指定事件。
 */
export function on_hook(event: string, callback: (...args: any[]) => void): unsubscribe_function
{
    if (!_subscribers.has(event))
    {
        _subscribers.set(event, new Set());
    }
    _subscribers.get(event)!.add(callback);
    return () => _subscribers.get(event)?.delete(callback);
}

/**
 * 觸發指定事件廣播。
 */
export function trigger_hook(event: string, ...args: any[]): void
{
    _subscribers.get(event)?.forEach(fn => fn(...args));
}