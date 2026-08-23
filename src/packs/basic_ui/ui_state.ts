export interface device_info_handler
{
    display_device_info: (uid: number) => boolean;
    clear_device_info:   () => void;
}

let active_handler: device_info_handler | null = null;

export function set_device_info_handler(handler: device_info_handler | null): void
{
    active_handler = handler;
}

export function get_device_info_handler(): device_info_handler | null
{
    return active_handler;
}

export function display_device_info(uid: number): boolean
{
    return active_handler ? active_handler.display_device_info(uid) : false;
}

export function clear_device_info(): void
{
    if (active_handler)
    {
        active_handler.clear_device_info();
    }
}
