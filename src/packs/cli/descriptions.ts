/**
 * 上游（cli 自身，以及比 cli 更接近 core 的 pack）的描述由 cli 以常數提供，鍵為 pack:name。
 * 上游 pack 不知道 cli，因此不寫 other_info.cli；下游 pack 改由 registry 的 other_info.cli.description 提供。
 */
export const upstream_descriptions: Readonly<Record<string, string>> =
{
    'cli:help':                   'help [command]: list all commands, or describe one.',
    'vanilla_beta:create_device': 'create_device <pack:id> <coords...>: create a device of that class at an even anchor.',
    'vanilla_beta:delete_device': 'delete_device <uid>: delete the device.',
    'vanilla_beta:move_device':   'move_device <uid> <coords...>: move the device to an even anchor.',
    'vanilla_beta:select_recipe': 'select_recipe <uid> [pack:id]: select a recipe; omit it or pass null to clear.',
    'vanilla_gamma:select_rule':  'select_rule <uid> [proportional | priority <i...>]: set the operating rule; omit it to use the recipe default.'
};
