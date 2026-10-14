import * as core from '@/core';

export const committed_event: core.namespaced_id = { namespace: 'core', id: 'committed' };

export interface applied_op
{
    op:        core.rev_op;
    direction: 'execute' | 'inverse';
}

/**
 * 依 manifests 順序組裝 catalog：合併 provides 與 on，再依序執行 patch。
 */
export function compose(manifests: core.pack_manifest[]): core.catalog
{
    const draft: core.catalog = { registry: new Map(), handlers: new Map(), create_states: new Map() };

    for (const manifest of manifests)
    {
        draft.registry.set(manifest.pack_id, { pack_id: manifest.pack_id, ...manifest.provides });
        if (manifest.create_state)
        {
            draft.create_states.set(manifest.pack_id, manifest.create_state);
        }

        for (const [key, handler] of Object.entries(manifest.on))
        {
            const idx = key.indexOf(':');
            if (idx === -1)
            {
                throw new Error(`Invalid hook key "${key}" in pack "${manifest.pack_id}": expected "namespace:id".`);
            }
            const namespace = key.slice(0, idx);
            const id = key.slice(idx + 1);

            if (!draft.handlers.has(namespace))
            {
                draft.handlers.set(namespace, new Map());
            }
            const by_id = draft.handlers.get(namespace)!;
            if (!by_id.has(id))
            {
                by_id.set(id, []);
            }
            by_id.get(id)!.push(handler);
        }
    }

    for (const manifest of manifests)
    {
        manifest.patch?.(draft);
    }

    return draft;
}

/**
 * 由 from 走到 to 實際套用過的 op：先沿祖先路徑 inverse 至 LCA，再沿子孫路徑 execute。
 */
function collect_applied(tree: core.tree, from: core.uid, to: core.uid): applied_op[]
{
    const lca = core.find_lca(tree, from, to);
    const applied: applied_op[] = [];

    for (let curr = from; curr !== lca; curr = tree.nodes.get(curr)!.parent_history_uid!)
    {
        const ops = tree.nodes.get(curr)!.operations;
        for (let i = ops.length - 1; i >= 0; i--)
        {
            applied.push({ op: ops[i], direction: 'inverse' });
        }
    }

    const down: core.uid[] = [];
    for (let curr = to; curr !== lca; curr = tree.nodes.get(curr)!.parent_history_uid!)
    {
        down.unshift(curr);
    }
    for (const uid of down)
    {
        for (const op of tree.nodes.get(uid)!.operations)
        {
            applied.push({ op, direction: 'execute' });
        }
    }

    return applied;
}

export class pure_world
{
    public readonly id:         string;
    public readonly catalog:    core.catalog;
    public readonly pack_state: Map<string, unknown>;
    public          space:      core.space;
    public          history:    core.tree;

    constructor(catalog: core.catalog, sp: core.space, id?: string)
    {
        this.id = id ?? `world_${Date.now()}`;
        this.catalog = catalog;
        this.space = sp;
        this.history = core.create_tree();
        this.pack_state = new Map();

        for (const [pack_id, create_state] of catalog.create_states)
        {
            this.pack_state.set(pack_id, create_state());
        }
    }

    public emit(target: core.namespaced_id, ...args: any[]): void
    {
        for (const handler of this.catalog.handlers.get(target.namespace)?.get(target.id) ?? [])
        {
            handler(...args);
        }
    }

    /**
     * 唯一寫入路徑：執行 run，若 history 游標移動則推導 change_set 並發出 committed。
     */
    private commit(run: () => boolean): boolean
    {
        const from = this.history.current_history_uid;
        const moved = run();
        const to = this.history.current_history_uid;
        if (moved && from !== to)
        {
            this.emit(committed_event, this, collect_applied(this.history, from, to));
        }
        return moved;
    }

    public submit(ops: core.rev_op[], other_info?: Record<string, unknown>): void
    {
        this.commit(() =>
        {
            core.record_operation(this.history, this.space, ops, other_info);
            return true;
        });
    }

    public undo(): boolean
    {
        return this.commit(() => core.jump_prev_node(this.history, this.space));
    }

    public redo(target?: core.uid): boolean
    {
        return this.commit(() => core.jump_next_node(this.history, this.space, target));
    }

    public jump_to(target: core.uid): boolean
    {
        return this.commit(() => core.jump_to_node(this.history, this.space, target));
    }

    public jump_to_prev_fork(): boolean
    {
        return this.commit(() => core.jump_to_prev_fork(this.history, this.space));
    }

    public jump_to_root(): boolean
    {
        return this.commit(() => core.jump_to_root(this.history, this.space));
    }

    /**
     * 沿當前分支前進至最深處（葉節點或下一個分岔點）。
     */
    public jump_to_leaf(): boolean
    {
        return this.commit(() => core.jump_to_next_fork(this.history, this.space));
    }

    /**
     * 刪除歷史葉節點不改變 space，以空的 change_set 發出 committed。
     */
    public delete_history_node(target: core.uid): boolean
    {
        const success = core.delete_node(this.history, target);
        if (success)
        {
            this.emit(committed_event, this, []);
        }
        return success;
    }
}
