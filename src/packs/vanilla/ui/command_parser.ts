import type { game_map, vector, rotation } from '@/core/types'
import type { pack_registry } from '@/core/pack_manager'
import { get_device_definition } from '@/core/pack_manager'
import { create_device, delete_device, move_device, rotate_device } from '@/core/map_manager'

export interface command_result
{
    ok:       boolean
    message:  string
}

/**
 * Splits a command line into tokens, respecting simple double-quoted strings.
 * e.g. `create --type belt --pos 0,0,0` -> ['create', '--type', 'belt', '--pos', '0,0,0']
 */
function tokenize(line: string): string[]
{
    const tokens: string[] = []
    const regex = /"([^"]*)"|(\S+)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(line)) !== null)
    {
        tokens.push(match[1] !== undefined ? match[1] : match[2])
    }

    return tokens
}

/**
 * Parses `--flag value` pairs from a token list (tokens[0] is assumed to be the verb, already stripped by caller).
 */
function parse_flags(tokens: string[]): Record<string, string>
{
    const flags: Record<string, string> = {}

    for (let i = 0; i < tokens.length; i++)
    {
        const tok = tokens[i]
        if (tok.startsWith('--'))
        {
            const key = tok.slice(2)
            const value = tokens[i + 1]
            if (value === undefined || value.startsWith('--'))
            {
                flags[key] = ''
            }
            else
            {
                flags[key] = value
                i++
            }
        }
    }

    return flags
}

function parse_vector(raw: string | undefined): vector | null
{
    if (!raw)
    {
        return null
    }

    const parts = raw.split(',').map(s => Number(s.trim()))
    if (parts.length !== 3 || parts.some(n => Number.isNaN(n)))
    {
        return null
    }

    return { x: parts[0], y: parts[1], z: parts[2] }
}

function parse_rotation(raw: string | undefined): rotation | null
{
    if (!raw)
    {
        return { x: 0, y: 0, z: 0 }
    }

    const parts = raw.split(',').map(s => Number(s.trim()))
    if (parts.length !== 3 || parts.some(n => ![0, 1, 2, 3].includes(n)))
    {
        return null
    }

    return { x: parts[0] as 0 | 1 | 2 | 3, y: parts[1] as 0 | 1 | 2 | 3, z: parts[2] as 0 | 1 | 2 | 3 }
}

/**
 * Executes a single CLI-style command line against the given map/registry.
 * Supported commands:
 *   create --type <definition_id> --pos x,y,z [--rot x,y,z]
 *   move   --id <unique_id> --pos x,y,z
 *   rotate --id <unique_id> --rot x,y,z
 *   delete --id <unique_id>
 */
export function execute_command(line: string, map: game_map, registry: pack_registry): command_result
{
    const trimmed = line.trim()
    if (trimmed.length === 0)
    {
        return { ok: false, message: 'Empty command.' }
    }

    const tokens = tokenize(trimmed)
    const verb = tokens[0]
    const flags = parse_flags(tokens.slice(1))

    switch (verb)
    {
        case 'create':
        {
            const definition_id = flags.type
            if (!definition_id)
            {
                return { ok: false, message: 'Missing --type <definition_id>.' }
            }

            const def = get_device_definition(registry, definition_id)
            if (!def)
            {
                return { ok: false, message: `Unknown device type "${definition_id}".` }
            }

            const position = parse_vector(flags.pos)
            if (!position)
            {
                return { ok: false, message: 'Missing or invalid --pos x,y,z.' }
            }

            const rot = parse_rotation(flags.rot)
            if (!rot)
            {
                return { ok: false, message: 'Invalid --rot x,y,z (each axis must be 0-3).' }
            }

            const unique_id = map.next_unique_id++

            create_device(map, {
                unique_id,
                definition_id,
                position,
                rotation: rot,
                other_info: {}
            })

            return { ok: true, message: `Created "${definition_id}" as #${unique_id} at (${position.x},${position.y},${position.z}).` }
        }

        case 'move':
        {
            const unique_id = Number(flags.id)
            if (!flags.id || Number.isNaN(unique_id))
            {
                return { ok: false, message: 'Missing or invalid --id <unique_id>.' }
            }

            const position = parse_vector(flags.pos)
            if (!position)
            {
                return { ok: false, message: 'Missing or invalid --pos x,y,z.' }
            }

            if (!map.devices.some(d => d.unique_id === unique_id))
            {
                return { ok: false, message: `No device with id #${unique_id}.` }
            }

            move_device(map, unique_id, position)
            return { ok: true, message: `Moved #${unique_id} to (${position.x},${position.y},${position.z}).` }
        }

        case 'rotate':
        {
            const unique_id = Number(flags.id)
            if (!flags.id || Number.isNaN(unique_id))
            {
                return { ok: false, message: 'Missing or invalid --id <unique_id>.' }
            }

            const rot = parse_rotation(flags.rot)
            if (!rot)
            {
                return { ok: false, message: 'Missing or invalid --rot x,y,z (each axis must be 0-3).' }
            }

            if (!map.devices.some(d => d.unique_id === unique_id))
            {
                return { ok: false, message: `No device with id #${unique_id}.` }
            }

            rotate_device(map, unique_id, rot)
            return { ok: true, message: `Rotated #${unique_id} to (${rot.x},${rot.y},${rot.z}).` }
        }

        case 'delete':
        {
            const unique_id = Number(flags.id)
            if (!flags.id || Number.isNaN(unique_id))
            {
                return { ok: false, message: 'Missing or invalid --id <unique_id>.' }
            }

            if (!map.devices.some(d => d.unique_id === unique_id))
            {
                return { ok: false, message: `No device with id #${unique_id}.` }
            }

            delete_device(map, unique_id)
            return { ok: true, message: `Deleted #${unique_id}.` }
        }

        default:
            return { ok: false, message: `Unknown command "${verb}". Try: create, move, rotate, delete.` }
    }
}