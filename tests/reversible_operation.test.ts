import { describe, it, expect } from 'vitest';
import * as core from '@/core';
import * as vanilla_alpha from '@/packs/vanilla_alpha';

describe('可逆操作契約與引數支援 (reversible_operation trailing args)', () =>
{
    it('execute 與 inverse 能自訂接收並處理附加參數 (...args: any[])', () =>
    {
        const log: string[] = [];

        const op: core.reversible_operation =
        {
            namespace: 'test_pack',
            id:        'custom_op',
            execute(sp: core.space, action_name?: string, value?: number)
            {
                log.push(`execute: ${action_name ?? 'none'} - ${value ?? 0} on [${sp.size.join(',')}]`);
            },
            inverse(sp: core.space, rollback_tag?: string)
            {
                log.push(`inverse: ${rollback_tag ?? 'none'} on [${sp.size.join(',')}]`);
            }
        };

        const sp = new core.space([8, 8]);

        // 直接帶參調用 execute
        op.execute(sp, 'spawn', 100);
        expect(log).toEqual(['execute: spawn - 100 on [8,8]']);

        // 直接帶參調用 inverse
        op.inverse(sp, 'rollback_tag_1');
        expect(log).toEqual([
            'execute: spawn - 100 on [8,8]',
            'inverse: rollback_tag_1 on [8,8]'
        ]);
    });

    it('能與 core.history 歷史樹無縫整合，重放時以無額外引數之純淨契約調用', () =>
    {
        const execution_history: string[] = [];

        const op: core.reversible_operation =
        {
            namespace: 'test_pack',
            id:        'history_op',
            execute(sp: core.space, ...args: any[])
            {
                const extra = args.length > 0 ? args.join(',') : 'no-args';
                execution_history.push(`exec(${extra})`);
            },
            inverse(sp: core.space, ...args: any[])
            {
                const extra = args.length > 0 ? args.join(',') : 'no-args';
                execution_history.push(`inv(${extra})`);
            }
        };

        const sp = new core.space([4, 4]);
        const tree = core.create_tree();

        // 透過 record_operation 記錄操作
        core.record_operation(tree, sp, [op]);
        expect(execution_history).toEqual(['exec(no-args)']);

        // 撤銷 (Undo)
        const undo_res = core.jump_prev_node(tree, sp);
        expect(undo_res).toBe(true);
        expect(execution_history).toEqual(['exec(no-args)', 'inv(no-args)']);

        // 重做 (Redo)
        const redo_res = core.jump_next_node(tree, sp);
        expect(redo_res).toBe(true);
        expect(execution_history).toEqual(['exec(no-args)', 'inv(no-args)', 'exec(no-args)']);
    });

    it('能於 pack_module.operations 註冊並透過 get_operation 查詢取得', () =>
    {
        const registry: core.pack_registry = new Map();

        const op_instance: core.reversible_operation =
        {
            namespace: 'custom_pack',
            id:        'echo_op',
            execute(_sp: core.space) {},
            inverse(_sp: core.space) {}
        };

        registry.set('custom_pack', {
            pack_id: 'custom_pack',
            operations: {
                echo_op: op_instance
            }
        });

        expect(vanilla_alpha.has_operation(registry, { namespace: 'custom_pack', id: 'echo_op' })).toBe(true);
        const retrieved = vanilla_alpha.get_operation(registry, { namespace: 'custom_pack', id: 'echo_op' });
        expect(retrieved).toBe(op_instance);
    });

    it('Vanilla 基礎操作之 other_info 統一使用 vanilla_alpha 命名空間', () =>
    {
        class mock_device extends core.device
        {
            public get_shape(): core.vector[] { return [[0, 0]]; }
            public get_port(): core.port[] { return []; }
        }

        const create_op = vanilla_alpha.create_device_operation(
            mock_device,
            { namespace: 'vanilla_alpha', id: 'test_dev' },
            [0, 0]
        );
        expect(create_op.other_info?.['vanilla_alpha']).toBeDefined();
        expect(create_op.other_info?.['core']).toBeUndefined();

        const delete_op = vanilla_alpha.delete_device_operation(1);
        expect(delete_op.other_info?.['vanilla_alpha']).toEqual({ device_uid: 1 });
        expect(delete_op.other_info?.['core']).toBeUndefined();

        const move_op = vanilla_alpha.move_device_operation(1, [2, 2]);
        expect(move_op.other_info?.['vanilla_alpha']).toEqual({ device_uid: 1, position: [2, 2] });

        const select_op = vanilla_alpha.select_recipe_operation(1, { namespace: 'vanilla_alpha', id: 'rec_1' });
        expect(select_op.other_info?.['vanilla_alpha']).toEqual({
            device_uid: 1,
            new_recipe_id: { namespace: 'vanilla_alpha', id: 'rec_1' }
        });
    });

    it('delete/move/select_recipe 找不到裝置時拋出明確例外 (Fail-Fast)', () =>
    {
        const sp = new core.space([10, 10]);

        const delete_op = vanilla_alpha.delete_device_operation(999);
        expect(() => delete_op.execute(sp)).toThrowError('Device with UID 999 not found in space.');

        const move_op = vanilla_alpha.move_device_operation(999, [2, 2]);
        expect(() => move_op.execute(sp)).toThrowError('Device with UID 999 not found in space.');

        const select_op = vanilla_alpha.select_recipe_operation(999);
        expect(() => select_op.execute(sp)).toThrowError('Device with UID 999 not found in space.');
    });
});
