import * as core from '@/core';
import { tokenize_input } from './parser';
import { generate_help } from './help';
import { find_cmd_op } from './lookup';

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

export function execute_command(input: string, registry: core.pack_registry): any
{
    const tokens = tokenize_input(input);
    if (tokens.length === 0)
    {
        return undefined;
    }

    if (tokens[0] === '--help')
    {
        if (tokens.length === 1)
        {
            return generate_help(registry);
        }
        if (tokens.length === 2)
        {
            return generate_help(registry, tokens[1]);
        }
    }

    const [cmd, ...raw_args] = tokens;
    const args = raw_args.map(parse_argument);

    return find_cmd_op(registry, cmd).execute(...args);
}

let console_registry: core.pack_registry | null = null;

export function set_console_registry(registry: core.pack_registry): void
{
    console_registry = registry;
}

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
