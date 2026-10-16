import * as core from '@/core';

/**
 * bidirectional 埠不列入：方向由 recipe 決定，尚未定案。
 */
export function ports_of(device: core.device, direction: core.port_direction): core.port[]
{
    return device.get_port().filter(p => p.direction === direction);
}
