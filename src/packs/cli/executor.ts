/**
 * src/packs/cli/executor.ts — CLI 指令分派與執行器
 */

import * as core from '@/core';
import * as world from '@/world';

function matches_alias(meta_alias: unknown, query: string): boolean
{
    return false;
}

function find_command
(
    registry: core.pack_registry,
    query:    string
): { pack: string; id: string; factory: any } | null
{
    return null;
}

function resolve_device_class
(
    registry: core.pack_registry,
    query:    string
): { dev_class: core.device_constructor; ns_id: core.namespaced_id } | null
{
    return null;
}

function execute_runtime_navigation(cmd: string, args: string[]): string | null
{
    return null;
}

export function execute_command(input: string): string
{
    return '';
}
