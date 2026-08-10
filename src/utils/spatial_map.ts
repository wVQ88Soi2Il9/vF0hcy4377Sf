import type { vector } from '@/core/types'
import { vector_to_string } from '@/utils/math'

/**
 * A generic spatial mapping utility that maps 3D grid vectors to a value of type T.
 */
export class spatial_map<T>
{
    private map = new Map<string, T>()

    /**
     * Sets a value at the given vector position.
     */
    set(pos: vector, value: T): void
    {
        this.map.set(vector_to_string(pos), value)
    }

    /**
     * Retrieves the value at the given vector position.
     */
    get(pos: vector): T | undefined
    {
        return this.map.get(vector_to_string(pos))
    }

    /**
     * Checks if a value exists at the given vector position.
     */
    has(pos: vector): boolean
    {
        return this.map.has(vector_to_string(pos))
    }

    /**
     * Gets the value at the given position, or inserts the default value if it doesn't exist.
     */
    get_or_insert(pos: vector, default_factory: () => T): T
    {
        const key = vector_to_string(pos)
        if (!this.map.has(key))
        {
            this.map.set(key, default_factory())
        }
        return this.map.get(key)!
    }

    /**
     * Returns an iterable of all values in the spatial map.
     */
    values(): IterableIterator<T>
    {
        return this.map.values()
    }

    /**
     * Returns an iterable of all keys (as strings) in the spatial map.
     */
    keys(): IterableIterator<string>
    {
        return this.map.keys()
    }
}
