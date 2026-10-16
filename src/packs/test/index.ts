import * as core from '@/core';
import * as vanilla_beta from '@/packs/vanilla_beta';

export const iron: core.item_stack = { item_id: { namespace: 'test', id: 'iron' }, quantity: 3 };

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

export const pass_through: core.recipe =
{
    namespace: 'test',
    id:        'pass_through',
    evaluate(context: vanilla_beta.recipe_context): core.item_stack[] { return context.inputs.map(s => ({ ...s })); }
};

export const manifest: core.pack_manifest =
{
    pack_id:  'test',
    provides: { recipes: { emit_iron, emit_two, pass_through } }
};
