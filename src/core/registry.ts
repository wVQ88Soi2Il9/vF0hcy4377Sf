import type { device_definition } from './types'

// Temporary in-memory registry to mock JSON lookup
const registry = new Map<string, device_definition>()

/**
 * Registers a device definition from JSON or code.
 */
export function register_device_definition(def: device_definition): void
{
    registry.set(def.id, def)
}

/**
 * Looks up a device definition by its ID.
 * @throws If the definition is not found.
 */
export function get_device_definition(id: string): device_definition
{
    const def = registry.get(id)
    if (!def)
    {
        throw new Error(`Device definition '${id}' not found in registry.`)
    }
    return def
}
