import type { recipe as recipe_type, recipe_evaluation } from '@/core';
import { get_space } from '@/world';

/**
 * Iron Gear recipe:
 * Evaluates dynamically based on the device instance (uid).
 * Only 'test:assembler' can manufacture iron gears.
 */
export const recipe: recipe_type =
{
    pack: 'test',
    id:   'iron_gear',
    evaluate(uid?: number): recipe_evaluation
    {
        if (uid !== undefined)
        {
            const map = get_space();
            const dev = map?.devices.find(d => d.uid === uid);
            if (dev && (dev.definition_id.pack !== 'test' || dev.definition_id.id !== 'assembler'))
            {
                return {
                    valid: false,
                    duration: 0,
                    inputs: [],
                    outputs: []
                };
            }
        }

        return {
            valid: true,
            duration: 2.0,
            inputs:
            [
                { item_id: { pack: 'test', id: 'iron_plate' }, quantity: 2 }
            ],
            outputs:
            [
                { item_id: { pack: 'test', id: 'iron_gear' }, quantity: 1 }
            ]
        };
    }
};

export default recipe;
