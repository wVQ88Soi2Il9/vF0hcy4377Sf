import { describe, it, expect } from 'vitest';
import * as core from '../src/core';
import * as world from '../src/world';
import * as cli from '../src/packs/cli';

function make_cmd(namespace: string, id: string, description?: string): core.cmd
{
    return {
        namespace,
        id,
        execute: (target_world: world.pure_world, ...args: unknown[]) => ({ world_id: target_world.id, from: namespace, args }),
        other_info: description === undefined ? undefined : { cli: { description } }
    };
}

function make_world(manifests: core.pack_manifest[]): world.pure_world
{
    return new world.pure_world(world.compose([cli.manifest, ...manifests]), new core.space([4, 4]), 'w');
}

const pack_a: core.pack_manifest =
{
    pack_id:  'pack_a',
    provides: { commands: { echo: make_cmd('pack_a', 'echo', 'echo from a'), only_a: make_cmd('pack_a', 'only_a', 'only in a') } }
};
const pack_b: core.pack_manifest =
{
    pack_id:  'pack_b',
    provides: { commands: { echo: make_cmd('pack_b', 'echo', 'echo from b') } }
};

describe('tokenize', () =>
{
    it('以空白分隔，引號內空白不分隔', () =>
    {
        expect(cli.tokenize('  a  "b c" \'d e\'  f ')).toEqual(
        [
            { text: 'a', quoted: false },
            { text: 'b c', quoted: true },
            { text: 'd e', quoted: true },
            { text: 'f', quoted: false }
        ]);
    });

    it('引號未閉合時報錯', () =>
    {
        expect(() => cli.tokenize('a "b c')).toThrow(/Unclosed quote/);
    });
});

describe('coerce', () =>
{
    it('布林、null、數字轉型，其他保留為文字', () =>
    {
        const values = cli.tokenize('true false null 4 -2.5 1e3 abc 4x').map(cli.coerce);
        expect(values).toEqual([true, false, null, 4, -2.5, 1000, 'abc', '4x']);
    });

    it('引號內一律為文字', () =>
    {
        expect(cli.tokenize('"4" "true"').map(cli.coerce)).toEqual(['4', 'true']);
    });
});

describe('run', () =>
{
    it('只寫指令名稱時找到唯一指令，並以 world 為第一個參數呼叫', () =>
    {
        const w = make_world([pack_a, pack_b]);
        expect(cli.run(w, 'only_a 4 "x y" true')).toEqual({ world_id: 'w', from: 'pack_a', args: [4, 'x y', true] });
    });

    it('pack:指令 指定來源', () =>
    {
        const w = make_world([pack_a, pack_b]);
        expect(cli.run(w, 'pack_b:echo')).toMatchObject({ from: 'pack_b' });
    });

    it('同名指令屬於多個 pack 時報錯並列出候選', () =>
    {
        const w = make_world([pack_a, pack_b]);
        expect(() => cli.run(w, 'echo')).toThrow('pack_a:echo, pack_b:echo');
    });

    it('找不到指令或 pack 時報錯', () =>
    {
        const w = make_world([pack_a]);
        expect(() => cli.run(w, 'nope')).toThrow(/not found/);
        expect(() => cli.run(w, 'pack_z:echo')).toThrow(/Pack "pack_z" not found/);
        expect(() => cli.run(w, '   ')).toThrow(/Empty/);
    });
});

describe('help', () =>
{
    it('列出所有指令與描述', () =>
    {
        const w = make_world([pack_a]);
        expect(cli.run(w, 'help')).toBe(
            'cli:help — help [command]: list all commands, or describe one.\n'
            + 'pack_a:echo — echo from a\n'
            + 'pack_a:only_a — only in a');
    });

    it('查詢單一指令', () =>
    {
        const w = make_world([pack_a, pack_b]);
        expect(cli.run(w, 'help pack_b:echo')).toBe('pack_b:echo — echo from b');
    });

    it('指令缺少描述時報錯', () =>
    {
        const w = make_world([{ pack_id: 'pack_c', provides: { commands: { bare: make_cmd('pack_c', 'bare') } } }]);
        expect(() => cli.run(w, 'help bare')).toThrow(/no other_info\.cli\.description/);
    });
});

describe('op_template', () =>
{
    function make_template(log: string[]): core.op_template
    {
        return {
            namespace: 'pack_t',
            id:        'mark',
            create(_target_world: world.pure_world, value: unknown): core.rev_op
            {
                return {
                    namespace: 'pack_t',
                    id:        'mark',
                    execute: () => { log.push(`exec ${value}`); },
                    inverse: () => { log.push(`inv ${value}`); }
                };
            },
            other_info: { cli: { description: 'mark a value' } }
        };
    }

    it('以參數產生 rev_op 並寫入歷史，undo / redo 重播同一個 rev_op', () =>
    {
        const log: string[] = [];
        const w = make_world([{ pack_id: 'pack_t', provides: { op_templates: { mark: make_template(log) } } }]);

        cli.run(w, 'mark 1');
        cli.run(w, 'pack_t:mark 2');
        expect(w.history.nodes.size).toBe(3);

        w.undo();
        w.redo();
        expect(log).toEqual(['exec 1', 'exec 2', 'inv 2', 'exec 2']);
    });

    it('help 列出 op_template 的描述', () =>
    {
        const w = make_world([{ pack_id: 'pack_t', provides: { op_templates: { mark: make_template([]) } } }]);
        expect(cli.run(w, 'help mark')).toBe('pack_t:mark — mark a value');
    });

    it('同一個 pack 的 command 與 op_template 同名時 compose 報錯', () =>
    {
        const manifest: core.pack_manifest =
        {
            pack_id:  'pack_t',
            provides: { commands: { mark: make_cmd('pack_t', 'mark', 'cmd') }, op_templates: { mark: make_template([]) } }
        };
        expect(() => world.compose([manifest])).toThrow(/both command and op_template "mark"/);
    });
});

describe('parse', () =>
{
    it('parse_int 接受整數，其他報錯', () =>
    {
        expect(cli.parse_int(4, 'x')).toBe(4);
        expect(() => cli.parse_int(4.5, 'x')).toThrow(/integer/);
        expect(() => cli.parse_int('4', 'x')).toThrow(/integer/);
    });

    it('parse_vector 取出指定數量的整數座標', () =>
    {
        expect(cli.parse_vector(['conveyor', 4, 4, 0], 1, 3, 'pos')).toEqual([4, 4, 0]);
        expect(() => cli.parse_vector(['conveyor', 4, 4], 1, 3, 'pos')).toThrow(/needs 3 integers, got 2/);
        expect(() => cli.parse_vector([4, 'a'], 0, 2, 'pos')).toThrow(/pos\[1\]/);
    });
});
