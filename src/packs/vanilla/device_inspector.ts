import type { game_map } from '@/core';
import { format_namespaced_id } from './identifier';

/**
 * Inspects a device on the map and formats its complete status as readable text.
 */
export function inspect_device_text(map: game_map, device_uid: number): string
{
    const dev = map.devices.find(d => d.uid === device_uid);
    if (!dev)
    {
        return `Error: Device ID ${device_uid} not found.`;
    }

    const lines: string[] = [
        `[Device #${dev.uid}] ${format_namespaced_id(dev.definition_id)}`,
        `  Position: [${dev.position.join(', ')}]`
    ];

    // Selected recipe
    if (dev.selected_recipe_id)
    {
        lines.push(`  Recipe:   ${format_namespaced_id(dev.selected_recipe_id)}`);
    }

    // Ports
    const in_ports = dev.get_port('input');
    const out_ports = dev.get_port('output');
    const total_ports = in_ports.length + out_ports.length;

    if (total_ports > 0)
    {
        lines.push(`  Ports (${total_ports}):`);
        for (const p of in_ports)
        {
            lines.push(`    - input at rel [${p.join(', ')}]`);
        }
        for (const p of out_ports)
        {
            lines.push(`    - output at rel [${p.join(', ')}]`);
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
