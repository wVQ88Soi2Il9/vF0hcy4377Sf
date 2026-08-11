import { hooks, type device_create_hook, type device_delete_hook, type device_move_hook } from '@/core/hooks'

export { create_device, delete_device, move_device } from '@/core/map_manager'

export type unsubscribe_function = () => void;

/**
 * Register a listener for when a device is created.
 */
export function on_device_create(callback: device_create_hook): unsubscribe_function
{
    hooks.on_device_create.push(callback);
    return () =>
    {
        const index = hooks.on_device_create.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_create.splice(index, 1);
        }
    };
}

/**
 * Register a listener for when a device is deleted.
 */
export function on_device_delete(callback: device_delete_hook): unsubscribe_function
{
    hooks.on_device_delete.push(callback);
    return () =>
    {
        const index = hooks.on_device_delete.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_delete.splice(index, 1);
        }
    };
}

/**
 * Register a listener for when a device is moved.
 */
export function on_device_move(callback: device_move_hook): unsubscribe_function
{
    hooks.on_device_move.push(callback);
    return () =>
    {
        const index = hooks.on_device_move.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_move.splice(index, 1);
        }
    };
}

/**
 * Universal listener for any device lifecycle change (create, delete, move).
 */
export function on_device_change(callback: () => void): unsubscribe_function
{
    const unsub_create = on_device_create(() => callback());
    const unsub_delete = on_device_delete(() => callback());
    const unsub_move = on_device_move(() => callback());

    return () =>
    {
        unsub_create();
        unsub_delete();
        unsub_move();
    };
}