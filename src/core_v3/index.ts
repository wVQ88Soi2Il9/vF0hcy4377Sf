/**
 * src/core_v3/index.ts — Core 模組唯一公開進入點
 *
 * 聚合匯出所有子模組（primitives, domain, command, history, hooks, registry, world）。
 */

// ── Primitives ───────────────────────────────────────────────────────────────
export * from './primitives';

// ── Domain ───────────────────────────────────────────────────────────────────
export * from './domain';

// ── Command ──────────────────────────────────────────────────────────────────
export * from './command/command';
export * from './command/create_device';
export * from './command/delete_device';
export * from './command/move_device';
export * from './command/select_recipe';

import type { space_command_factory } from './command/command';
import { create_device_command } from './command/create_device';
import { delete_device_command } from './command/delete_device';
import { move_device_command } from './command/move_device';
import { select_recipe_command } from './command/select_recipe';

export const core_commands: Record<string, space_command_factory> =
{
    create_device: create_device_command,
    delete_device: delete_device_command,
    move_device:   move_device_command,
    select_recipe: select_recipe_command
};

// ── History ──────────────────────────────────────────────────────────────────
export * from './history';

// ── Systems & Entities ───────────────────────────────────────────────────────
export * from './hooks';
export * from './registry';
export * from './world';
