import { recipe_base, type recipe_evaluation } from '@/API';
import { get_map } from '@/runtime';

export class advanced_circuit_recipe extends recipe_base
{
    constructor()
    {
        super('advanced_circuit');
    }

    public evaluate(uid?: number): recipe_evaluation
    {
        let altitude = 0;

        if (uid !== undefined)
        {
            const map = get_map();
            const dev = map?.devices.find(d => d.uid === uid);
            if (dev)
            {
                if (dev.definition_id !== 'test:assembler')
                {
                    return {
                        valid:    false,
                        duration: 0,
                        inputs:   [],
                        outputs:  []
                    };
                }
                altitude = dev.position.length > 2 ? dev.position[2] : 0;
            }
        }

        const duration = Math.max(1.0, 5.0 - altitude * 0.5);

        return {
            valid:    true,
            duration: duration,
            inputs:
            [
                { item_id: 'test:copper_wire', quantity: 4 },
                { item_id: 'test:iron_plate', quantity: 2 }
            ],
            outputs:
            [
                { item_id: 'test:advanced_circuit', quantity: 1 }
            ],
            other_info:
            {
                altitude_bonus: altitude > 0
            }
        };
    }
}

export const recipe = new advanced_circuit_recipe();
export default recipe;
