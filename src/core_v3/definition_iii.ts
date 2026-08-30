import { namespaced_id } from "./definition_i";
import { space } from "./definition_ii";

export interface reversible_operation extends namespaced_id {
    /** 對目標空間施加異動 */
    execute(sp: space): void;

    /** 還原對空間的異動（必須為 execute 的精確邏輯反操作） */
    inverse(sp: space): void;

    /** 指令實例可擴充中繼資料 */
    other_info?: Record<string, unknown>;
}

export type reversible_operation_factory = (...args: any[]) => reversible_operation;