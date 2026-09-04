import * as core from '@/core';

/**
 * 自指令取得描述文字（假資料）
 */
export function get_command_describe(_command?: core.cmd | core.reversible_operation): string
{
    return 'mock describe';
}

/**
 * 生成說明文字（假資料）
 */
export function generate_help(_registry: core.pack_registry, target_cmd?: string): string
{
    if (target_cmd)
    {
        return `mock_pack:${target_cmd} - mock describe`;
    }
    return '[mock_pack]\n  mock_cmd - mock describe';
}
