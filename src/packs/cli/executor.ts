import * as world from '@/world';
import { tokenize_input, parse_argument } from './parser';
import { generate_help, find_target } from './help';

export function exe(input: string, target_world: world.pure_world): any
{
    const tokens = tokenize_input(input);
    if (tokens.length === 0)
    {
        return undefined;
    }

    if (tokens[0] === '--help')
    {
        return generate_help(target_world.registry, tokens[1]);
    }

    const [name, ...raw_args] = tokens;
    const entry = find_target(target_world.registry, name);
    if (!entry)
    {
        throw new Error(`Command or operation "${name}" not found in registry.`);
    }

    if ('inverse' in entry.target)
    {
        return entry.target.execute(target_world.space);
    }

    const args = raw_args.map(parse_argument);
    return entry.target.execute(...args);
}

let console_world: world.pure_world | null = null;

export function set_console_world(target_world: world.pure_world): void
{
    console_world = target_world;
}

export function execute_in_console(input: string): any
{
    if (!console_world)
    {
        throw new Error('CLI Console Error: World is not bound. Call set_console_world(target_world) or register_console_cli(target_world) first.');
    }
    return exe(input, console_world);
}

export function register_console_cli(target_world?: world.pure_world): void
{
    if (target_world)
    {
        console_world = target_world;
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
