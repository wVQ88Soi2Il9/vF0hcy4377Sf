import * as core from '@/core';
import { tokenize_input } from './parser';
import { generate_help } from './help';

function parse_argument(token: string): any
{
    if (token === 'true'){ return true; }
    if (token === 'false'){ return false; }
    if (token === 'null'){ return null; }
    if (token.trim() !== '' && !isNaN(Number(token))){ return Number(token); }    
    return token;
}

function find_command(registry: core.pack_registry, cmd: string): core.cmd | ((...args: any[]) => any) | null
{
    if (cmd.includes(':'))
    {
        const [namespace, id] = cmd.split(':');
        const pack = registry.get(namespace);
        return pack?.commands?.[id] ?? pack?.operations?.[id] ?? null;
    }

    for (const pack of registry.values())
    {
        const target = pack.commands?.[cmd] ?? pack.operations?.[cmd];
        if (target)
        {
            return target;
        }
    }

    return null;
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

    const target = find_command(registry, cmd);
    if (!target)
    {
        throw new Error(`Command "${cmd}" not found in registry.`);
    }

    if (typeof target === 'function')
    {
        return target(...args);
    }
    return target.execute(...args);
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
        throw new Error('CLI Console Error: Registry is not bound. Call set_console_registry(registry) or register_console_cli(registry) first.');
    }
    return execute_command(input, console_registry);
}

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
