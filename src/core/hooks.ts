import type { space, device, vector, history_tree, namespaced_id } from './types';

export type device_create_hook = (map: space, dev: device) => void;
export type device_delete_hook = (map: space, dev: device) => void;
export type device_move_hook =
(
    map:          space,
    dev:          device,
    old_position: vector,
    new_position: vector
) => void;
export type device_select_recipe_hook =
(
    map:           space,
    dev:           device,
    old_recipe_id: namespaced_id | undefined,
    new_recipe_id: namespaced_id | undefined
) => void;
export type history_change_hook = (tree: history_tree) => void;

export const hooks = 
{
    on_device_create:        [] as device_create_hook[],
    on_device_delete:        [] as device_delete_hook[],
    on_device_move:          [] as device_move_hook[],
    on_device_select_recipe: [] as device_select_recipe_hook[],
    on_history_change:       [] as history_change_hook[]
};

export function trigger_create_device(map: space, dev: device): void
{
    for (const hook of hooks.on_device_create)
    {
        hook(map, dev);
    }
}

export function trigger_delete_device(map: space, dev: device): void
{
    for (const hook of hooks.on_device_delete)
    {
        hook(map, dev);
    }
}

export function trigger_move_device
(
    map:          space,
    dev:          device,
    old_position: vector,
    new_position: vector
): void
{
    for (const hook of hooks.on_device_move)
    {
        hook(map, dev, old_position, new_position);
    }
}

export function trigger_select_recipe
(
    map:           space,
    dev:           device,
    old_recipe_id: namespaced_id | undefined,
    new_recipe_id: namespaced_id | undefined
): void
{
    for (const hook of hooks.on_device_select_recipe)
    {
        hook(map, dev, old_recipe_id, new_recipe_id);
    }
}

export function trigger_history_change(tree: history_tree): void
{
    for (const hook of hooks.on_history_change)
    {
        hook(tree);
    }
}

export type unsubscribe_function = () => void;

function create_hook_subscriber<T>(list: T[]): (fn: T) => unsubscribe_function
{
    return (fn: T): unsubscribe_function =>
    {
        list.push(fn);
        return () =>
        {
            const index = list.indexOf(fn);
            if (index !== -1)
            {
                list.splice(index, 1);
            }
        };
    };
}

export const on_device_create = create_hook_subscriber(hooks.on_device_create);
export const on_device_delete = create_hook_subscriber(hooks.on_device_delete);
export const on_device_move = create_hook_subscriber(hooks.on_device_move);
export const on_device_select_recipe = create_hook_subscriber(hooks.on_device_select_recipe);
export const on_history_change = create_hook_subscriber(hooks.on_history_change);

export function on_device_change(callback: () => void): unsubscribe_function
{
    const unsub_create        = on_device_create(() => callback());
    const unsub_delete        = on_device_delete(() => callback());
    const unsub_move          = on_device_move(() => callback());
    const unsub_select_recipe = on_device_select_recipe(() => callback());
    return () =>
    {
        unsub_create();
        unsub_delete();
        unsub_move();
        unsub_select_recipe();
    };
}
