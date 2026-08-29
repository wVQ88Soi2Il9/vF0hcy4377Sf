/**
 * src/core_v3/hooks.ts — 通用事件廣播發布/訂閱機制
 */

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