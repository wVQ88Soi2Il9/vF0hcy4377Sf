import * as core from '@/core';
import { create_device_template, delete_device_template, move_device_template, select_recipe_template } from './templates';

export * from './axes';
export * from './history';
export * from './spatial';
export * from './parse';
export * from './templates';
export * from './evaluate';

export const manifest: core.pack_manifest =
{
    pack_id:  'vanilla_beta',
    provides:
    {
        op_templates:
        {
            create_device: create_device_template,
            delete_device: delete_device_template,
            move_device:   move_device_template,
            select_recipe: select_recipe_template
        }
    }
};
