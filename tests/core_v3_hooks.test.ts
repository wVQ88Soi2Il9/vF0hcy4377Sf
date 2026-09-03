import { describe, it, expect, vi } from 'vitest';
import 
{
    register_pack,
    pure_world,
    space
} from '../src/core';
import type { pack_module, pack_registry } from '../src/core';
import { build_empty_hook_list } from '../src/main';

describe('Core v3 Hook System 5-stage lifecycle', () =>
{
    it('應完整走通 5 階段生命週期並保證多世界事件隔離', () =>
    {
        // ── 階段 1：init ────────────────────────────────────────────────────────
        const registry: pack_registry = { packs: new Map() };
        expect(registry.packs.size).toBe(0);

        // ── 階段 2：complete registry ───────────────────────────────────────────
        const pack_a: pack_module =
        {
            pack_id: 'pack_a',
            hooks: new Map([
                ['event_created', []],
                ['event_deleted', []]
            ])
        };

        const pack_b: pack_module =
        {
            pack_id: 'pack_b',
            hooks: new Map([
                ['custom_action', []]
            ])
        };

        register_pack(registry, pack_a);
        register_pack(registry, pack_b);

        expect(registry.packs.has('pack_a')).toBe(true);
        expect(registry.packs.has('pack_b')).toBe(true);

        // ── 階段 3：complete empty hook list ────────────────────────────────────
        const empty_hooks = build_empty_hook_list(registry);

        expect(empty_hooks.get('pack_a')?.get('event_created')).toEqual([]);
        expect(empty_hooks.get('pack_a')?.get('event_deleted')).toEqual([]);
        expect(empty_hooks.get('pack_b')?.get('custom_action')).toEqual([]);

        // ── 階段 4：new world ───────────────────────────────────────────────────
        const sp1 = new space([10, 10]);
        const sp2 = new space([10, 10]);

        const world_1 = new pure_world(sp1, empty_hooks, 'world_1');
        const world_2 = new pure_world(sp2, empty_hooks, 'world_2');

        // 驗證槽位已自動繼承且保證記憶體實例獨立
        expect(world_1.current_hook).not.toBe(world_2.current_hook);
        expect(world_1.current_hook.get('pack_a')).not.toBe(world_2.current_hook.get('pack_a'));
        expect(world_1.current_hook.get('pack_a')?.get('event_created')).not.toBe(
            world_2.current_hook.get('pack_a')?.get('event_created')
        );

        // ── 階段 5：inject callbacks ────────────────────────────────────────────
        const callback_1 = vi.fn();
        const callback_2 = vi.fn();

        world_1.inject_hook(
            { namespace: 'pack_a', id: 'event_created' },
            callback_1
        );

        world_2.inject_hook(
            { namespace: 'pack_a', id: 'event_created' },
            callback_2
        );

        // 驗證只觸發 world_1 時，僅 callback_1 執行，world_2 完全隔離
        world_1.trigger({ namespace: 'pack_a', id: 'event_created' }, 'world_1_payload');

        expect(callback_1).toHaveBeenCalledTimes(1);
        expect(callback_1).toHaveBeenCalledWith('world_1_payload');
        expect(callback_2).not.toHaveBeenCalled();

        // 驗證觸發 world_2 時，僅 callback_2 執行
        world_2.trigger({ namespace: 'pack_a', id: 'event_created' }, 'world_2_payload');

        expect(callback_1).toHaveBeenCalledTimes(1);
        expect(callback_2).toHaveBeenCalledTimes(1);
        expect(callback_2).toHaveBeenCalledWith('world_2_payload');

        // 驗證觸發未綁定 callback 的 hook 不會拋錯且靜默執行
        expect(() =>
        {
            world_1.trigger({ namespace: 'pack_a', id: 'event_deleted' });
        }).not.toThrow();
    });
});
