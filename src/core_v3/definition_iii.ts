/* how to control a world */

import { namespaced_id } from "./definition_i";
import { space } from "./definition_ii";

export interface reversible_operation extends namespaced_id 
{
    execute(sp: space): void;
    inverse(sp: space): void;
    other_info?: Record<string, unknown>;
}

export type reversible_operation_factory = (...args: any[]) => reversible_operation;