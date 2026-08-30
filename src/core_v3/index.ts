/**
 * src/core_v3/index.ts — Core 模組唯一公開進入點
 *
 * 聚合匯出所有子模組（primitives, domain, command, history, hooks, registry, world）。
 */

// ── Primitives & Utilities (Level I) ──────────────────────────────────────────
export * from './definition_i';

// ── Domain & Entities (Level II) ─────────────────────────────────────────────
export * from './definition_ii';

// ── Operations & Commands (Level III) ─────────────────────────────────────────
export * from './definition_iii';

// ── History ──────────────────────────────────────────────────────────────────
export * from './history';

// ── Systems & Entities ───────────────────────────────────────────────────────
export * from './registry';
export * from './world';
