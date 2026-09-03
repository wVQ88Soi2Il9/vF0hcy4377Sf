import * as core from '@/core';
import { format_namespaced_id } from './identifier';

/**
 * Inspects a device on the map and formats its complete status as readable text.
 */
export function inspect_device_text(map: core.space, device_uid: core.uid): string
{
    const dev = map.devices.find(d => d.device_uid === device_uid);
    if (!dev)
    {
        return `Error: Device ID ${device_uid} not found.`;
    }

    const lines: string[] = [
        `[Device #${dev.device_uid}] ${format_namespaced_id(dev.definition_id)}`,
        `  Position: [${dev.position.join(', ')}]`
    ];

    // Selected recipe
    const selected_recipe_id = (dev as any).selected_recipe_id;
    if (selected_recipe_id)
    {
        lines.push(`  Recipe:   ${format_namespaced_id(selected_recipe_id)}`);
    }

    // Ports
    const ports = dev.get_port();
    if (ports.length > 0)
    {
        lines.push(`  Ports (${ports.length}):`);
        for (const p of ports)
        {
            lines.push(`    - ${p.direction} (port #${p.port_uid}) at rel [${p.offset.join(', ')}]`);
        }
    }

    // 2.5D Transform capabilities (if present)
    const transform = (dev as any).transform;
    if (transform && typeof transform === 'object')
    {
        const rot_deg = (transform.rotation ?? 0) * 90;
        const flipped = Boolean(transform.flipped);
        lines.push(`  Transform: rotation=${rot_deg}°, flipped=${flipped}`);
    }

    return lines.join('\n');
}
