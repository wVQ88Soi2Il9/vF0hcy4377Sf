import type { recipe, recipe_evaluation, item_stack } from '@/API';
import { get_map } from '@/runtime';

/**
 * OOP Recipe class encapsulating dynamic evaluation for a placed machine instance.
 */
export class ef_recipe
{
    public readonly id:           string;
    public readonly machine_id:   string;
    public readonly machine_name: string;
    public readonly machine_mode: string;
    public readonly environment:  string;
    public readonly duration:     number;
    public readonly inputs:       item_stack[];
    public readonly outputs:      item_stack[];

    constructor
    (
        id:           string,
        machine_id:   string,
        machine_name: string,
        duration:     number = 2.0,
        inputs:       item_stack[] = [],
        outputs:      item_stack[] = [],
        machine_mode: string = 'default',
        environment:  string = 'none'
    )
    {
        this.id           = id;
        this.machine_id   = machine_id;
        this.machine_name = machine_name;
        this.duration     = duration;
        this.inputs       = inputs;
        this.outputs      = outputs;
        this.machine_mode = machine_mode;
        this.environment  = environment;
    }

    /**
     * Evaluates this recipe for a specific device instance on the map.
     */
    public evaluate(uid?: number): recipe_evaluation
    {
        if (uid !== undefined)
        {
            const map = get_map();
            const dev = map?.devices.find(d => d.uid === uid);
            const expected_def_id = this.machine_id.includes(':') ? this.machine_id : `ef:${this.machine_id}`;
            if (dev && dev.definition_id !== expected_def_id)
            {
                return {
                    valid:    false,
                    duration: 0,
                    inputs:   [],
                    outputs:  []
                };
            }
        }

        const resolved_inputs = this.inputs.map(inp => ({
            item_id:  inp.item_id.includes(':') ? inp.item_id : `ef:${inp.item_id}`,
            quantity: inp.quantity
        }));
        const resolved_outputs = this.outputs.map(out => ({
            item_id:  out.item_id.includes(':') ? out.item_id : `ef:${out.item_id}`,
            quantity: out.quantity
        }));

        return {
            valid:    true,
            duration: this.duration,
            inputs:   resolved_inputs,
            outputs:  resolved_outputs,
            other_info:
            {
                machine_name: this.machine_name,
                machine_mode: this.machine_mode,
                environment:  this.environment
            }
        };
    }

    /**
     * Converts this OOP recipe to the engine recipe contract.
     */
    public to_recipe(): recipe
    {
        return {
            id:       this.id,
            evaluate: (uid?: number) => this.evaluate(uid),
            other_info:
            {
                machine_name: this.machine_name,
                machine_mode: this.machine_mode,
                environment:  this.environment
            }
        };
    }
}
