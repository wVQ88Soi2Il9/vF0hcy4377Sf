import * as core from '@/core';
import { tokenize_input } from './parser';

/**
 * 將 token 字串轉型為基礎型別 (number, boolean, null) 或保留原字串。
 */
function parse_argument(token: string): any
{
    if (token === 'true'){ return true; }
    if (token === 'false'){ return false; }
    if (token === 'null'){ return null; }
    if (token.trim() !== '' && !isNaN(Number(token))){ return Number(token); }    
    return token;
}

/**
 * 在 registry 中查找指定指令名稱/ID 的執行函式。
 * 支援:
 * 1. 帶 namespace 查找: "namespace:cmd" -> registry.get(namespace)
 * 2. 不帶 namespace 查找: 遍歷所有 pack 查找 operations 或 commands
 */
function find_command(registry: core.pack_registry, cmd: string): ((...args: any[]) => any) | null
{
    if (cmd.includes(':'))
    {
        const [namespace, id] = cmd.split(':');
        return registry.get(namespace)?.operations?.[id] ?? null;
    }

    for (const pack of registry.values())
    {
        const fn = pack.operations?.[cmd];
        if (fn)
        {
            return fn;
        }
    }

    return null;
}

/**
 * 需求 2:
 * 接收 string, 用 parser.ts 拆成 cmd(...any: any[]), 查 registry 執行。
 */
export function execute_command(input: string, registry: core.pack_registry): any
{
    const tokens = tokenize_input(input);
    if (tokens.length === 0)
    {
        return undefined;
    }

    const [cmd, ...raw_args] = tokens;
    const args = raw_args.map(parse_argument);

    const fn = find_command(registry, cmd);
    if (!fn)
    {
        throw new Error(`Command "${cmd}" not found in registry.`);
    }

    return fn(...args);
}

// ── 需求 3: 在 console 也能用 (單獨做) ──────────────────────────────────────────

let console_registry: core.pack_registry | null = null;

/**
 * 設定供 Console 使用的目標 registry
 */
export function set_console_registry(registry: core.pack_registry): void
{
    console_registry = registry;
}

/**
 * Console 專用執行函式：直接傳入指令字串，自動以綁定的 registry 執行
 */
export function execute_in_console(input: string): any
{
    if (!console_registry)
    {
        throw new Error('CLI Console Error: Registry 尚未綁定，請先呼叫 set_console_registry(registry) 或 register_console_cli(registry)。');
    }
    return execute_command(input, console_registry);
}

/**
 * 掛載 CLI 至全域物件 (window.cli / globalThis.cli) 供開發者於 DevTools Console 直接呼叫
 */
export function register_console_cli(registry?: core.pack_registry): void
{
    if (registry)
    {
        console_registry = registry;
    }

    const runner = (input: string) =>
    {
        try
        {
            const result = execute_in_console(input);
            console.log(result);
            return result;
        }
        catch (err: any)
        {
            console.error(err?.message ?? err);
            throw err;
        }
    };

    if (typeof globalThis !== 'undefined')
    {
        (globalThis as any).cli = runner;
    }
}
