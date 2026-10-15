import type { namespaced_id, hook_callback, hook_list } from './definition_i';
import type { space, item_definition, recipe, device_constructor } from './definition_ii';

export interface rev_op extends namespaced_id 
{
    execute(sp: space,...args: any[]): void;
    inverse(sp: space,...args: any[]): void;
    other_info?: Record<string, unknown>;
}

/**
 * 指令：execute 的第一個參數為目標 world，其後為 CLI 解析後的參數。
 * 說明文字放在 other_info.cli.description。
 */
export interface cmd extends namespaced_id
{
    execute(...args: any[]): any;
    other_info?: Record<string, unknown>;
}

/**
 * Registry 條目：一個 pack 在組裝完成後提供的定義。
 */
export interface pack_module
{
    pack_id:       string;
    items?:        Record<string, item_definition>;
    recipes?:      Record<string, recipe>;
    devices?:      Record<string, device_constructor>;
    operations?:   Record<string, rev_op>;
    commands?:     Record<string, cmd>;
    other_info?:   Record<string, unknown>;
}

export type pack_registry = Map<string, pack_module>;

/**
 * 組裝結果，所有世界共用。組裝完成後視為不可變。
 */
export interface catalog
{
    registry:      pack_registry;
    handlers:      hook_list;
    create_states: Map<string, () => unknown>;
}

/**
 * Pack 交給 compose 的宣告。
 * - on：'namespace:id' → handler，handler 透過參數取得 world。
 * - create_state：每個世界建立時產生此 pack 的私有狀態。
 * - patch：組裝期間修改尚未凍結的 catalog。
 */
export interface pack_manifest
{
    pack_id:       string;
    provides?:     Omit<pack_module, 'pack_id'>;
    on?:           Record<string, hook_callback>;
    create_state?: () => unknown;
    patch?:        (draft: catalog) => void;
}
