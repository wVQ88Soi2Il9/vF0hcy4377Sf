import * as core from '@/core';
import * as vanilla_gamma from '@/packs/vanilla_gamma';

export const iron: core.item_stack = { item_id: { namespace: 'test', id: 'iron' }, quantity: 3 };
export const coal: core.item_stack = { item_id: { namespace: 'test', id: 'coal' }, quantity: 3 };

function is_iron(stack: core.item_stack): boolean
{
    return stack.item_id.namespace === iron.item_id.namespace && stack.item_id.id === iron.item_id.id;
}

/** 埠由建構後指定的測試裝置。 */
export class port_device extends core.device
{
    public ports: core.port[] = [];
    public get_shape(): core.vector[] { return [[0, 0]]; }
    public get_port(): core.port[] { return this.ports; }
}

export const emit_iron: core.recipe =
{
    namespace: 'test',
    id:        'emit_iron',
    evaluate(): core.item_stack[] { return [{ ...iron }]; }
};

export const emit_two: core.recipe =
{
    namespace: 'test',
    id:        'emit_two',
    evaluate(): core.item_stack[] { return [{ ...iron }, { ...iron }]; }
};

export const emit_coal: core.recipe =
{
    namespace: 'test',
    id:        'emit_coal',
    evaluate(): core.item_stack[] { return [{ ...coal }]; }
};

export const pass_through: core.recipe =
{
    namespace: 'test',
    id:        'pass_through',
    evaluate(context: vanilla_gamma.recipe_context): core.item_stack[] { return context.inputs.map(s => ({ ...s })); }
};

/** 只收鐵、上限 2：f = min(x, 2)；item 不符時輸出 0。 */
export const iron_pipe: core.recipe =
{
    namespace: 'test',
    id:        'iron_pipe',
    evaluate(context: vanilla_gamma.recipe_context): core.item_stack[]
    {
        const input = context.inputs[0];
        return is_iron(input) ? [{ item_id: iron.item_id, quantity: Math.min(input.quantity, 2) }] : [vanilla_gamma.null_stack()];
    }
};

/** 沒有 output 的 sink。 */
export const sink: core.recipe =
{
    namespace: 'test',
    id:        'sink',
    evaluate(): core.item_stack[] { return []; }
};

/** 2 個 input：out = min(a + b, 2)；預設等比例。 */
export const merge_two: core.recipe =
{
    namespace:  'test',
    id:         'merge_two',
    other_info: { vanilla_gamma: { flow: { rule: { kind: 'proportional' } } } },
    evaluate(context: vanilla_gamma.recipe_context): core.item_stack[]
    {
        const [a, b] = context.inputs.map(s => s.quantity);
        return [{ item_id: iron.item_id, quantity: Math.min(a + b, 2) }];
    }
};

export const manifest: core.pack_manifest =
{
    pack_id:  'test',
    provides: { recipes: { emit_iron, emit_two, emit_coal, pass_through, iron_pipe, sink, merge_two } }
};
