import * as core from '@/core';
import { select_rule_template_api } from './rule';

export * from './ports';
export * from './rule';
export * from './evaluate';

export const manifest: core.pack_manifest =
{
    pack_id:  'vanilla_gamma',
    provides:
    {
        op_templates:
        {
            select_rule: select_rule_template_api
        }
    }
};
