/**
 * src/core/index.ts — Core 模組唯一公開 Public Entrypoint
 *
 * 聚合導出 Core 引擎的所有公開型別、管理器、指令與 Hooks 介面。
 * 零全域狀態，零外部依賴。外部跨模組引用時，一律透過 `@/core` 存取。
 */

export * from './types';
export * from './pack_manager';
export * from './map_manager';
export * from './history_manager';
export * from './commands';
export * from './hooks';
