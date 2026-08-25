import type { device, space, map_command } from '@/core';
import type { d4_transform, rotatable_device } from './types';

/**
 * Type guard checking if a device implements rotatable_device interface.
 */
export function is_rotatable_device(dev: device): dev is rotatable_device
{
    return (
        typeof (dev as any).rotate === 'function' &&
        typeof (dev as any).flip === 'function' &&
        typeof (dev as any).set_transform === 'function' &&
        'transform' in dev
    );
}

/**
 * Command for rotating a 2.5D device by specified steps (default: 1 step = 90° counter-clockwise).
 * Remembers previous transform so inverse (undo) can revert it.
 */
export function rotate_device_command(device_uid: number, steps: number = 1): map_command
{
    let previous_transform: d4_transform | null = null;
    let target_dev: rotatable_device | null = null;

    return {
        pack: 'layered_2d',
        id:   'rotate_device',
        other_info:
        {
            layered_2d:
            {
                device_uid,
                steps
            }
        },
        execute(map: space): void
        {
            const dev = map.devices.find(d => d.uid === device_uid);
            if (dev && is_rotatable_device(dev))
            {
                target_dev = dev;
                if (previous_transform === null)
                {
                    previous_transform = { ...dev.transform };
                }
                dev.rotate(steps);
            }
        },
        inverse(_map: space): void
        {
            if (target_dev && previous_transform !== null)
            {
                target_dev.set_transform(previous_transform);
            }
        }
    };
}

/**
 * Command for flipping a 2.5D device across horizontal axis.
 * Remembers previous transform so inverse (undo) can revert it.
 */
export function flip_device_command(device_uid: number): map_command
{
    let previous_transform: d4_transform | null = null;
    let target_dev: rotatable_device | null = null;

    return {
        pack: 'layered_2d',
        id:   'flip_device',
        other_info:
        {
            layered_2d:
            {
                device_uid
            }
        },
        execute(map: space): void
        {
            const dev = map.devices.find(d => d.uid === device_uid);
            if (dev && is_rotatable_device(dev))
            {
                target_dev = dev;
                if (previous_transform === null)
                {
                    previous_transform = { ...dev.transform };
                }
                dev.flip();
            }
        },
        inverse(_map: space): void
        {
            if (target_dev && previous_transform !== null)
            {
                target_dev.set_transform(previous_transform);
            }
        }
    };
}

/**
 * Command for setting a 2.5D device transform directly.
 */
export function set_device_transform_command(device_uid: number, transform: d4_transform): map_command
{
    let previous_transform: d4_transform | null = null;
    let target_dev: rotatable_device | null = null;

    return {
        pack: 'layered_2d',
        id:   'set_device_transform',
        other_info:
        {
            layered_2d:
            {
                device_uid,
                transform: { ...transform }
            }
        },
        execute(map: space): void
        {
            const dev = map.devices.find(d => d.uid === device_uid);
            if (dev && is_rotatable_device(dev))
            {
                target_dev = dev;
                if (previous_transform === null)
                {
                    previous_transform = { ...dev.transform };
                }
                dev.set_transform(transform);
            }
        },
        inverse(_map: space): void
        {
            if (target_dev && previous_transform !== null)
            {
                target_dev.set_transform(previous_transform);
            }
        }
    };
}

(rotate_device_command as any).other_info = {
    cli: {
        alias:    'rotate',
        describe: 'Rotate a 2.5D device counter-clockwise by step(s)'
    }
};

(flip_device_command as any).other_info = {
    cli: {
        alias:    'flip',
        describe: 'Toggle vertical flip of a 2.5D device'
    }
};

(set_device_transform_command as any).other_info = {
    cli: {
        describe: 'Set 2.5D transform of a device directly'
    }
};
