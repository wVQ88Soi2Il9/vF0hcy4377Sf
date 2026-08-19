import type { recipe, recipe_evaluation } from '@/API';
import { get_map } from '@/runtime';

/**
 * Iron Gear recipe:
 * Evaluates dynamically based on the device instance (uid).
 * Only 'test:assembler' can manufacture iron gears.
 */
export const recipe: recipe =
{
    id: 'iron_gear',
    evaluate(uid?: number): recipe_evaluation
    {
        if (uid !== undefined)
        {
            const map = get_map();
            const dev = map?.devices.find(d => d.uid === uid);
            if (dev && dev.definition_id !== 'test:assembler')
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
                { item_id: 'test:iron_plate', quantity: 2 }
            ],
            outputs:
            [
                { item_id: 'test:iron_gear', quantity: 1 }
            ]
        };
    }
};

export default recipe;
