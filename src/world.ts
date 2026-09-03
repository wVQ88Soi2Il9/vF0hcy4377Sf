import * as core from '@/core';

export class pure_world
{
    public readonly id:                 string;
    public          space:              core.space;
    public          history:            core.tree;
    public          current_hook:       core.hook_list;

    constructor(sp: core.space, template?: core.hook_list, id?: string)
    {
        this.id = id ?? `world_${Date.now()}`;
        this.space = sp;
        this.history = core.create_tree();
        this.current_hook = template ? structuredClone(template) : new Map();
    }

    public inject_hook(target_hook: core.namespaced_id, callback: core.hook_callback): void
    {
        this.current_hook.get(target_hook.namespace)!.get(target_hook.id)!.push(callback);
    }

    public trigger(namespaced_id: core.namespaced_id, ...args: any[]): void
    {
        const trigger_functions = this.current_hook.get(namespaced_id.namespace)?.get(namespaced_id.id) ?? [];
        for (const f of trigger_functions)
        {
            f(...args);
        }
    }
}
