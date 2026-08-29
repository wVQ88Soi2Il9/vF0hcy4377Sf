import type { namespaced_id } from '../primitives';
import type { space } from '../domain';

/**
 * 可逆空間異動指令契約。
 * `execute` 施加異動；`inverse` 執行精確反向還原。
 */
export interface space_command extends namespaced_id
{
    /** 對目標空間施加異動 */
    execute(sp: space): void;

    /** 還原對空間的異動（必須為 execute 的精確邏輯反操作） */
    inverse(sp: space): void;

    /** 指令實例可擴充中繼資料 */
    other_info?: Record<string, unknown>;
}

export type space_command_factory = (...args: any[]) => space_command;
