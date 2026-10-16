import * as core from '@/core';
import * as world from '@/world';
import * as vanilla_beta from '@/packs/vanilla_beta';
import { ports_of } from './ports';

/**
 * 多個極大運轉點時的選擇規則。
 * proportional：供應等比例縮放；priority：依 order（input 埠索引排列）依序吃滿，縮減時反向。
 */
export type operating_rule =
    | { kind: 'proportional' }
    | { kind: 'priority'; order: number[] };

/**
 * recipe 在 other_info.vanilla_gamma.flow 的宣告：預設規則。
 */
export interface recipe_flow
{
    rule?: operating_rule;
}

export function get_recipe_flow(recipe: core.recipe): recipe_flow
{
    const info = recipe.other_info?.['vanilla_gamma'] as { flow?: recipe_flow } | undefined;
    return info?.flow ?? {};
}

/**
 * priority 的 order 必須是 0..input_count-1 的排列。
 */
export function check_rule(rule: operating_rule, input_count: number): void
{
    if (rule.kind === 'proportional')
    {
        return;
    }
    const sorted = [...rule.order].sort((a, b) => a - b);
    if (sorted.length !== input_count || sorted.some((v, i) => v !== i))
    {
        throw new Error(`Priority order must be a permutation of 0..${input_count - 1}, got [${rule.order.join(', ')}].`);
    }
}

/**
 * device 上的規則覆寫值，存於 other_info.vanilla_gamma.rule。
 */
export function get_device_rule(device: core.device): operating_rule | undefined
{
    const info = device.other_info?.['vanilla_gamma'] as { rule?: operating_rule } | undefined;
    return info?.rule;
}

/**
 * rule 為 undefined 時清除覆寫值。
 */
export function set_device_rule(device: core.device, rule: operating_rule | undefined): void
{
    if (!device.other_info)
    {
        device.other_info = {};
    }
    const info = { ...(device.other_info['vanilla_gamma'] as Record<string, unknown> | undefined) };
    if (rule === undefined)
    {
        delete info['rule'];
    }
    else
    {
        info['rule'] = rule;
    }
    device.other_info['vanilla_gamma'] = info;
}

function get_device(sp: core.space, device_uid: core.uid): core.device
{
    const dev = sp.devices.get(device_uid);
    if (!dev)
    {
        throw new Error(`Device with UID ${device_uid} not found in space.`);
    }
    return dev;
}

/**
 * 選定規則：設定 device 的規則覆寫值並記憶舊值；Undo 撤銷時還原。rule 為 undefined 時清除。
 * create 時以 device 的 input 埠數檢查 order。
 */
export const select_rule_template =
{
    namespace: 'vanilla_gamma',
    id:        'select_rule',
    create(target_world: world.pure_world, device_uid: core.uid, rule?: operating_rule): core.rev_op
    {
        if (rule !== undefined)
        {
            check_rule(rule, ports_of(get_device(target_world.space, device_uid), 'input').length);
        }
        let previous: operating_rule | undefined = undefined;
        let initialized = false;

        return {
            namespace: 'vanilla_gamma',
            id:        'select_rule',
            other_info:
            {
                vanilla_gamma:
                {
                    device_uid,
                    rule
                }
            },
            execute(sp: core.space): void
            {
                const dev = get_device(sp, device_uid);
                if (!initialized)
                {
                    previous = get_device_rule(dev);
                    initialized = true;
                }
                set_device_rule(dev, rule);
            },
            inverse(sp: core.space): void
            {
                if (initialized)
                {
                    set_device_rule(get_device(sp, device_uid), previous);
                }
            }
        };
    }
} satisfies core.op_template<world.pure_world>;

/**
 * cli 用：select_rule <uid> [proportional | priority <i...>]；省略規則時清除覆寫值。
 */
export const select_rule_template_api: core.op_template<world.pure_world> =
{
    namespace: 'vanilla_gamma',
    id:        'select_rule',
    create(target_world: world.pure_world, ...args: unknown[]): core.rev_op
    {
        const usage = 'Usage: select_rule <uid> [proportional | priority <i...>]';
        if (args.length < 1)
        {
            throw new Error(usage);
        }
        const device_uid = vanilla_beta.parse_uid(args[0], 'uid');
        let rule: operating_rule | undefined;
        if (args.length === 1)
        {
            rule = undefined;
        }
        else if (args[1] === 'proportional' && args.length === 2)
        {
            rule = { kind: 'proportional' };
        }
        else if (args[1] === 'priority')
        {
            rule = { kind: 'priority', order: args.slice(2).map((v, i) => vanilla_beta.parse_int(v, `order[${i}]`)) };
        }
        else
        {
            throw new Error(usage);
        }
        return select_rule_template.create(target_world, device_uid, rule);
    }
};
