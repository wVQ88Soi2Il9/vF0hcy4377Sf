import * as core from '@/core';
import { create_device_cli_template, delete_device_cli_template, move_device_cli_template, select_recipe_cli_template } from './cli_templates';

export * from './axes';
export * from './history';
export * from './spatial';
export * from './parse';
export * from './cli_templates';
export * from './graph';

export const manifest: core.pack_manifest =
{
    pack_id:  'vanilla_beta',
    provides:
    {
        op_templates:
        {
            create_device: create_device_cli_template,
            delete_device: delete_device_cli_template,
            move_device:   move_device_cli_template,
            select_recipe: select_recipe_cli_template
        }
    }
};
