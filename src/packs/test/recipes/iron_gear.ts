import { recipe_base, type recipe_evaluation } from '@/API';
import { get_map } from '@/runtime';

export class iron_gear_recipe extends recipe_base
{
    constructor()
    {
        super('iron_gear');
    }

    public evaluate(uid?: number): recipe_evaluation
    {
        if (uid !== undefined)
        {
            const map = get_map();
            const dev = map?.devices.find(d => d.uid === uid);
            if (dev && dev.definition_id !== 'test:assembler')
            {
                return {
                    valid:    false,
                    duration: 0,
                    inputs:   [],
                    outputs:  []
                };
            }
        }

        return {
            valid:    true,
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
}

export const recipe = new iron_gear_recipe();
export default recipe;
