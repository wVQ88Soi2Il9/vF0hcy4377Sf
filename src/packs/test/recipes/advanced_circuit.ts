import type { recipe as recipe_type, recipe_evaluation } from '@/core';
import { get_map } from '@/world';

/**
 * Advanced Circuit recipe:
 * Dynamic evaluation: Valid for assemblers; duration scales with height/altitude (Z axis).
 */
export const recipe: recipe_type =
{
    pack: 'test',
    id:   'advanced_circuit',
    evaluate(uid?: number): recipe_evaluation
    {
        let altitude = 0;

        if (uid !== undefined)
        {
            const map = get_map();
            const dev = map?.devices.find(d => d.uid === uid);
            if (dev)
            {
                if (dev.definition_id.pack !== 'test' || dev.definition_id.id !== 'assembler')
                {
                    return {
                        valid: false,
                        duration: 0,
                        inputs: [],
                        outputs: []
                    };
                }
                altitude = dev.position.length > 2 ? dev.position[2] : 0;
            }
        }

        // Higher altitude speeds up cooling/processing
        const duration = Math.max(1.0, 5.0 - altitude * 0.5);

        return {
            valid: true,
            duration: duration,
            inputs:
            [
                { item_id: { pack: 'test', id: 'copper_wire' }, quantity: 4 },
                { item_id: { pack: 'test', id: 'iron_plate' }, quantity: 2 }
            ],
            outputs:
            [
                { item_id: { pack: 'test', id: 'advanced_circuit' }, quantity: 1 }
            ],
            other_info:
            {
                test:
                {
                    altitude_bonus: altitude > 0
                }
            }
        };
    }
};

export default recipe;
