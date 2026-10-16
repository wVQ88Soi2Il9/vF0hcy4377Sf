import * as core from '@/core';
import * as world from '@/world';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import { parse_vector } from './parse';
import { is_valid_device_position } from './spatial';

/**
 * 「pack:id」字串轉為 namespaced_id；缺少 pack 或 id 時報錯。
 */
export function parse_qualified_id(value: unknown, name: string): core.namespaced_id
{
    if (typeof value !== 'string')
    {
        throw new Error(`Argument "${name}" must be "pack:id", got ${JSON.stringify(value)}.`);
    }
    const idx = value.indexOf(':');
    if (idx <= 0 || idx === value.length - 1)
    {
        throw new Error(`Argument "${name}" must be "pack:id", got "${value}".`);
    }
    return vanilla_alpha.parse_namespaced_id(value);
}

export function parse_uid(value: unknown, name: string): core.uid
{
    if (typeof value !== 'string')
    {
        throw new Error(`Argument "${name}" must be a uid string, got ${JSON.stringify(value)}.`);
    }
    return value;
}

/**
 * 從 args[start] 起取恰好 space.dimension 個偶數座標；多餘參數、數量不足、非整數或奇數時報錯。
 */
export function parse_anchor(target_world: world.pure_world, args: unknown[], start: number): core.vector
{
    const dim = target_world.space.dimension;
    if (args.length !== start + dim)
    {
        throw new Error(`Expected ${dim} coordinates, got ${args.length - start}.`);
    }
    const pos = parse_vector(args, start, dim, 'position');
    if (!is_valid_device_position(pos))
    {
        throw new Error(`Device anchor must be even on every axis, got [${pos.join(', ')}].`);
    }
    return pos;
}

function expect_arg_count(args: unknown[], min: number, max: number, usage: string): void
{
    if (args.length < min || args.length > max)
    {
        throw new Error(`Usage: ${usage}`);
    }
}

export const create_device_template_api: core.op_template<world.pure_world> =
{
    namespace: 'vanilla_beta',
    id:        'create_device',
    create(target_world: world.pure_world, ...args: unknown[]): core.rev_op
    {
        const definition_id = parse_qualified_id(args[0], 'class');
        const device_class = vanilla_alpha.get_device_class(target_world.catalog.registry, definition_id);
        const position = parse_anchor(target_world, args, 1);
        return vanilla_alpha.create_device_template.create(target_world, core.generate_uid(), device_class, definition_id, position);
    }
};

export const delete_device_template_api: core.op_template<world.pure_world> =
{
    namespace: 'vanilla_beta',
    id:        'delete_device',
    create(target_world: world.pure_world, ...args: unknown[]): core.rev_op
    {
        expect_arg_count(args, 1, 1, 'delete_device <uid>');
        return vanilla_alpha.delete_device_template.create(target_world, parse_uid(args[0], 'uid'));
    }
};

export const move_device_template_api: core.op_template<world.pure_world> =
{
    namespace: 'vanilla_beta',
    id:        'move_device',
    create(target_world: world.pure_world, ...args: unknown[]): core.rev_op
    {
        const device_uid = parse_uid(args[0], 'uid');
        return vanilla_alpha.move_device_template.create(target_world, device_uid, parse_anchor(target_world, args, 1));
    }
};

export const select_recipe_template_api: core.op_template<world.pure_world> =
{
    namespace: 'vanilla_beta',
    id:        'select_recipe',
    create(target_world: world.pure_world, ...args: unknown[]): core.rev_op
    {
        expect_arg_count(args, 1, 2, 'select_recipe <uid> [pack:id]');
        const device_uid = parse_uid(args[0], 'uid');
        const recipe_id = args[1] === undefined || args[1] === null ? undefined : parse_qualified_id(args[1], 'recipe');
        return vanilla_alpha.select_recipe_template.create(target_world, device_uid, recipe_id);
    }
};
