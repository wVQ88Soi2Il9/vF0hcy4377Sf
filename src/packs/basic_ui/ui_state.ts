import type { info_bar_component } from './info_bar';

let active_info_bar: info_bar_component | null = null;

export function set_active_info_bar(bar: info_bar_component | null): void
{
    active_info_bar = bar;
}

export function get_active_info_bar(): info_bar_component | null
{
    return active_info_bar;
}

export function display_device_info(uid: number): boolean
{
    return active_info_bar ? active_info_bar.display_device_info(uid) : false;
}

export function clear_device_info(): void
{
    if (active_info_bar)
    {
        active_info_bar.clear_device_info();
    }
}
