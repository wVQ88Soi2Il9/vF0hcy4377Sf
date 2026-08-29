import type { uid } from "@/core_v3";

export interface map_validation_result
{
    out_of_bounds: uid[];
    overlapped:    uid[];
}