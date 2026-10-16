import * as core from '@/core';

/** 埠由建構後指定的測試裝置。 */
export class port_device extends core.device
{
    public ports: core.port[] = [];
    public get_shape(): core.vector[] { return [[0, 0]]; }
    public get_port(): core.port[] { return this.ports; }
}
