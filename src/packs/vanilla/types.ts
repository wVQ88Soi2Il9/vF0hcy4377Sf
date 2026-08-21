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

/**
 * 單一空間格點上的連接埠佔用記錄。
 * in_uids：佔用此格的 input 端裝置 uid 列表。
 * out_uids：佔用此格的 output 端裝置 uid 列表。
 */
export interface port_cell
{
    in_uids:  number[];
    out_uids: number[];
}

/**
 * build_device_graph 的完整回傳結果。
 *
 * nodes：有向連接圖節點列表。
 *
 * z_slice_index：以奇數 Z 座標為 key（格式 "x,y,z"）的交界面索引。
 * 由於 2× Grid 保證垂直端口的 Z 恆為奇數，此索引僅含跨層連線端口，
 * 可直接用 pos[2] % 2 !== 0 過濾，無須重掃全部設備。
 */
export interface device_graph
{
    nodes:          device_node[];
    z_slice_index:  Map<string, port_cell>;
}
