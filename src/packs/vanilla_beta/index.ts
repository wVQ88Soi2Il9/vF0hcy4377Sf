import * as core from '@/core';
import { create_device_template_api, delete_device_template_api, move_device_template_api, select_recipe_template_api } from './templates_api';

export * from './axes';
export * from './history';
export * from './spatial';
export * from './parse';
export * from './templates_api';

export const manifest: core.pack_manifest =
{
    pack_id:  'vanilla_beta',
    provides:
    {
        op_templates:
        {
            create_device: create_device_template_api,
            delete_device: delete_device_template_api,
            move_device:   move_device_template_api,
            select_recipe: select_recipe_template_api
        }
    }
};
