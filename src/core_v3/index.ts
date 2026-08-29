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


// ── History ──────────────────────────────────────────────────────────────────
export * from './history';

// ── Systems & Entities ───────────────────────────────────────────────────────
export * from './hooks';
export * from './registry';
export * from './world';
