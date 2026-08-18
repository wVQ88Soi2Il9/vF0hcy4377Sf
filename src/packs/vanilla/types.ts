export interface map_validation_result
{
    out_of_bounds: number[];
    overlapped:    number[];
}

export interface device_node
{
    uid:            number;
    previous_nodes: number[];
    next_nodes:     number[];
}
