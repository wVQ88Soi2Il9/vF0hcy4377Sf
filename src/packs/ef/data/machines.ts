/**
 * 機器靜態定義資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/machines.json（含基礎材料輸出點）
 *       docs/aaaaa/data/machine_tags.json（分類標籤）
 * 另附 FlowEngine stub：物品輸出口（固體）、物品輸入口（sink；總產值只計此處交付）。
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { machine, machine_category } from '../types/machine';
export { get_machine_mode } from '../types/machine';

// ─── 分類標籤（V9-C1）──────────────────────────────────────────────────────────

/** 機器 tag 分頁順序；對齊 machine_tags.json */
export const machine_tags: readonly machine_category[] = [
    '物流設備',
    '倉庫存取',
    '基礎生產',
    '合成製造',
    '電力',
];

const _known_tag_set = new Set<string>(machine_tags);

// ─── 機器定義陣列 ─────────────────────────────────────────────────────────────

/**
 * 全部機器的靜態定義陣列，模組載入時建立一次，整個應用生命週期內唯讀共用。
 */
export const machine_list: machine[] = [
    {
        id: 'shaping_machine',
        name: '塑型機',
        width: 3,
        height: 3,
        power: 10,
        tags: ['基礎生產'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'base_mode',
                label: '基礎模式',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                ],
                loss: null,
            },
            {
                id: 'gas_mode',
                label: '氣體模式',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'left', offset: 1, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'filling_machine',
        name: '灌裝機',
        width: 6,
        height: 4,
        power: 20,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'base_mode',
                label: '基礎模式',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                    { side: 'top', offset: 5, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                    { side: 'bottom', offset: 5, media: 'belt' },
                ],
                loss: null,
            },
            {
                id: 'gas_liquid_mode',
                label: '氣液模式',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                    { side: 'top', offset: 5, media: 'belt' },
                    { side: 'left', offset: 1, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                    { side: 'bottom', offset: 5, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'refinery',
        name: '精煉爐',
        width: 3,
        height: 3,
        power: 5,
        tags: ['基礎生產'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'base_mode',
                label: '基礎模式',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                ],
                loss: null,
            },
            {
                id: 'liquid_mode',
                label: '液體模式',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'left', offset: 1, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'crusher',
        name: '粉碎機',
        width: 3,
        height: 3,
        power: 5,
        tags: ['基礎生產'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'parts_machine',
        name: '配件機',
        width: 3,
        height: 3,
        power: 20,
        tags: ['基礎生產'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'equipment_parts_machine',
        name: '裝備原件機',
        width: 4,
        height: 6,
        power: 10,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'left', offset: 0, media: 'belt' },
                    { side: 'left', offset: 1, media: 'belt' },
                    { side: 'left', offset: 2, media: 'belt' },
                    { side: 'left', offset: 3, media: 'belt' },
                    { side: 'left', offset: 4, media: 'belt' },
                    { side: 'left', offset: 5, media: 'belt' },
                ],
                output_ports: [
                    { side: 'right', offset: 0, media: 'belt' },
                    { side: 'right', offset: 1, media: 'belt' },
                    { side: 'right', offset: 2, media: 'belt' },
                    { side: 'right', offset: 3, media: 'belt' },
                    { side: 'right', offset: 4, media: 'belt' },
                    { side: 'right', offset: 5, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'packaging_machine',
        name: '封裝機',
        width: 6,
        height: 4,
        power: 20,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                    { side: 'top', offset: 5, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                    { side: 'bottom', offset: 5, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'grinder',
        name: '研磨機',
        width: 6,
        height: 4,
        power: 50,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                    { side: 'top', offset: 5, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                    { side: 'bottom', offset: 5, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'reactor',
        name: '反應池',
        width: 5,
        height: 5,
        power: 50,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'left', offset: 1, media: 'belt' },
                    { side: 'left', offset: 3, media: 'belt' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'right', offset: 3, media: 'pipe' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'tianyou_furnace',
        name: '天有洪爐',
        width: 5,
        height: 5,
        power: 50,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                    { side: 'left', offset: 2, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'purifier',
        name: '提純機',
        width: 5,
        height: 5,
        power: 50,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'liquid_mode',
                label: '液體模式',
                input_ports: [
                    { side: 'left', offset: 1, media: 'pipe' },
                    { side: 'left', offset: 3, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'right', offset: 3, media: 'pipe' },
                ],
                loss: null,
            },
            {
                id: 'gas_mode',
                label: '氣體模式',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                    { side: 'left', offset: 2, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'right', offset: 3, media: 'pipe' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'disassembler',
        name: '拆解機',
        width: 6,
        height: 4,
        power: 20,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                    { side: 'top', offset: 5, media: 'belt' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                    { side: 'bottom', offset: 5, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'item_access_port',
        name: '物品准入口',
        width: 1,
        height: 1,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 0, media: 'belt' }],
                output_ports: [{ side: 'right', offset: 0, media: 'belt' }],
                loss: null,
            },
        ],
    },

    {
        id: 'splitter',
        name: '分流器',
        width: 1,
        height: 1,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 0, media: 'belt' }],
                output_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'right', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 0, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'logistics_bridge',
        name: '物流橋',
        width: 1,
        height: 1,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'left', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 0, media: 'belt' },
                ],
                output_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'right', offset: 0, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'merger',
        name: '匯流器',
        width: 1,
        height: 1,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'left', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 0, media: 'belt' },
                ],
                output_ports: [{ side: 'right', offset: 0, media: 'belt' }],
                loss: null,
            },
        ],
    },

    {
        id: 'pipe_access_port',
        name: '管道准入口',
        width: 1,
        height: 1,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 0, media: 'pipe' }],
                output_ports: [{ side: 'right', offset: 0, media: 'pipe' }],
                loss: null,
            },
        ],
    },

    {
        id: 'pipe_splitter',
        name: '管道分流器',
        width: 1,
        height: 1,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 0, media: 'pipe' }],
                output_ports: [
                    { side: 'top', offset: 0, media: 'pipe' },
                    { side: 'right', offset: 0, media: 'pipe' },
                    { side: 'bottom', offset: 0, media: 'pipe' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'pipe_bridge',
        name: '管道橋',
        width: 1,
        height: 1,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'left', offset: 0, media: 'pipe' },
                    { side: 'bottom', offset: 0, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'top', offset: 0, media: 'pipe' },
                    { side: 'right', offset: 0, media: 'pipe' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'pipe_merger',
        name: '管道匯流器',
        width: 1,
        height: 1,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'pipe' },
                    { side: 'left', offset: 0, media: 'pipe' },
                    { side: 'bottom', offset: 0, media: 'pipe' },
                ],
                output_ports: [{ side: 'right', offset: 0, media: 'pipe' }],
                loss: null,
            },
        ],
    },

    {
        id: 'protocol_storage_box',
        name: '協議儲存箱',
        width: 3,
        height: 3,
        power: 5,
        tags: ['倉庫存取'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'warehouse_input',
        name: '倉庫存貨口',
        width: 3,
        height: 1,
        power: 0,
        tags: ['倉庫存取'],
        is_source: false,
        is_sink: true,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'top', offset: 1, media: 'belt' }],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'warehouse_output',
        name: '倉庫取貨口',
        width: 3,
        height: 1,
        power: 0,
        tags: ['倉庫存取'],
        is_source: true,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [{ side: 'top', offset: 1, media: 'belt' }],
                loss: null,
            },
        ],
    },

    {
        id: 'liquid_tank',
        name: '儲液罐',
        width: 3,
        height: 3,
        power: 0,
        tags: ['倉庫存取'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 1, media: 'pipe' }],
                output_ports: [{ side: 'right', offset: 1, media: 'pipe' }],
                loss: null,
            },
        ],
    },

    {
        id: 'warehouse_line_base',
        name: '倉庫存取線基段',
        width: 4,
        height: 8,
        power: 0,
        tags: ['倉庫存取'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'warehouse_line_source',
        name: '倉庫存取線源樁',
        width: 4,
        height: 4,
        power: 0,
        tags: ['倉庫存取'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'conduit_inlet',
        name: '暗管入口',
        width: 3,
        height: 3,
        power: 0,
        tags: ['倉庫存取'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 1, media: 'pipe' }],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'conduit_outlet',
        name: '暗管出口',
        width: 3,
        height: 3,
        power: 0,
        tags: ['倉庫存取'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [{ side: 'right', offset: 1, media: 'pipe' }],
                loss: null,
            },
        ],
    },

    {
        id: 'multi_conduit_inlet',
        name: '多口暗管入口',
        width: 3,
        height: 5,
        power: 0,
        tags: ['倉庫存取'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'left', offset: 1, media: 'pipe' },
                    { side: 'left', offset: 3, media: 'pipe' },
                ],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'multi_conduit_outlet',
        name: '多口暗管出口',
        width: 3,
        height: 5,
        power: 0,
        tags: ['倉庫存取'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'right', offset: 3, media: 'pipe' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'seed_harvester',
        name: '採種機',
        width: 5,
        height: 5,
        power: 10,
        tags: ['基礎生產'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'planter',
        name: '種植機',
        width: 5,
        height: 5,
        power: 20,
        tags: ['基礎生產'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'base_mode',
                label: '基礎模式',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                ],
                loss: null,
            },
            {
                id: 'liquid_mode',
                label: '液體模式',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                    { side: 'left', offset: 2, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 0, media: 'belt' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'wastewater_processor',
        name: '廢水處理機',
        width: 3,
        height: 3,
        power: 50,
        tags: ['基礎生產'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 1, media: 'pipe' }],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'large_reactor',
        name: '擴容反應池',
        width: 6,
        height: 5,
        power: 100,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'belt' },
                    { side: 'top', offset: 3, media: 'belt' },
                    { side: 'top', offset: 4, media: 'belt' },
                    { side: 'left', offset: 1, media: 'pipe' },
                    { side: 'left', offset: 3, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'right', offset: 3, media: 'pipe' },
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 2, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                    { side: 'bottom', offset: 4, media: 'belt' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'power_pole',
        name: '供電樁',
        width: 2,
        height: 2,
        power: 0,
        tags: ['電力'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'xi_rang_power_pole',
        name: '息壤供電樁',
        width: 2,
        height: 2,
        power: 0,
        tags: ['電力'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'relay',
        name: '中繼器',
        width: 3,
        height: 3,
        power: 0,
        tags: ['電力'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'xi_rang_relay',
        name: '息壤中繼器',
        width: 3,
        height: 3,
        power: 0,
        tags: ['電力'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'thermal_pool',
        name: '熱能池',
        width: 2,
        height: 2,
        power: 0,
        tags: ['電力'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'top', offset: 0, media: 'belt' },
                    { side: 'top', offset: 1, media: 'belt' },
                ],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'liquid_gas_converter',
        name: '液氣轉化機',
        width: 5,
        height: 5,
        power: 50,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'liquid_mode',
                label: '液體產出',
                input_ports: [
                    { side: 'top', offset: 2, media: 'pipe' },
                    { side: 'left', offset: 1, media: 'pipe' },
                    { side: 'left', offset: 3, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'right', offset: 3, media: 'pipe' },
                ],
                loss: { item: '液化息壤', rate_per_min: 6 },
            },
            {
                id: 'gas_mode',
                label: '氣體產出',
                input_ports: [
                    { side: 'top', offset: 2, media: 'pipe' },
                    { side: 'left', offset: 1, media: 'pipe' },
                    { side: 'left', offset: 3, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'right', offset: 3, media: 'pipe' },
                ],
                loss: { item: '液化息壤', rate_per_min: 6 },
            },
        ],
    },

    {
        id: 'solid_gas_converter',
        name: '固氣轉化機',
        width: 5,
        height: 5,
        power: 50,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'solid_mode',
                label: '固體產出',
                input_ports: [
                    { side: 'top', offset: 2, media: 'pipe' },
                    { side: 'left', offset: 1, media: 'pipe' },
                    { side: 'left', offset: 3, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'bottom', offset: 1, media: 'belt' },
                    { side: 'bottom', offset: 3, media: 'belt' },
                ],
                loss: { item: '息壤氣', rate_per_min: 6 },
            },
            {
                id: 'gas_mode',
                label: '氣體產出',
                input_ports: [
                    { side: 'top', offset: 1, media: 'belt' },
                    { side: 'top', offset: 2, media: 'pipe' },
                    { side: 'top', offset: 3, media: 'belt' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'right', offset: 3, media: 'pipe' },
                ],
                loss: { item: '息壤氣', rate_per_min: 6 },
            },
        ],
    },

    {
        id: 'gas_reactor',
        name: '氣體反應爐',
        width: 5,
        height: 5,
        power: 50,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [
                    { side: 'left', offset: 1, media: 'pipe' },
                    { side: 'left', offset: 3, media: 'pipe' },
                ],
                output_ports: [
                    { side: 'right', offset: 1, media: 'pipe' },
                    { side: 'right', offset: 3, media: 'pipe' },
                ],
                loss: null,
            },
        ],
    },

    {
        id: 'gas_disperser',
        name: '氣體散布機',
        width: 3,
        height: 3,
        power: -1,
        tags: ['合成製造'],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 1, media: 'pipe' }],
                output_ports: [],
                loss: null,
            },
        ],
    },

    {
        id: 'material_source',
        name: '基礎材料輸出點',
        width: 1,
        height: 3,
        power: 0,
        tags: ['倉庫存取'],
        is_source: true,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'solid_belt',
                label: '固體輸送帶',
                input_ports: [],
                output_ports: [{ side: 'right', offset: 1, media: 'belt' }],
                loss: null,
            },
            {
                id: 'fluid_pipe',
                label: '液氣管道',
                input_ports: [],
                output_ports: [{ side: 'right', offset: 1, media: 'pipe' }],
                loss: null,
            },
        ],
    },

    {
        id: 'item_source',
        name: '物品輸出口',
        width: 1,
        height: 3,
        power: 0,
        tags: ['物流設備'],
        is_source: true,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [{ side: 'right', offset: 1, media: 'belt' }],
                loss: null,
            },
        ],
    },

    {
        id: 'item_sink',
        name: '物品輸入口',
        width: 1,
        height: 3,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: true,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'right', offset: 1, media: 'belt' }],
                output_ports: [],
                loss: null,
            },
        ],
    },
];

// ─── 查詢 Map ───────────────────────────────────────────────────────────────────

/** name（中文）→ Machine 快查 Map */
export const machine_map: ReadonlyMap<string, machine> = new Map
(
    machine_list.map((m) => [m.name, m])
);
    

/** id（英文 snake_case）→ Machine 快查 Map */
const _machine_by_id_map: ReadonlyMap<string, machine> = new Map
(
    machine_list.map((m) => [m.id, m])
);

// ─── 查詢函式 ───────────────────────────────────────────────────────────────────

/**
 * 依中文名稱查詢機器定義。
 *
 * @param name 機器中文名稱（對應 Machine.name）
 */
export function get_machine(name: string): machine | undefined
{
    return machine_map.get(name);
}

/**
 * 依英文 id 查詢機器定義。
 *
 * @param id 機器英文 id（對應 Machine.id）
 */
export function get_machine_by_id(id: string): machine | undefined
{
    return _machine_by_id_map.get(id);
}

/**
 * 取得所有機器定義列表的副本。
 */
export function get_all_machines(): machine[]
{
    return [...machine_list];
}

/**
 * 依 tag 篩選機器（一機多 tag 可出現在多個分頁）。
 *
 * @param tag `all`＝全部；`untagged`＝無已知 tag；其餘為 machine_category
 */
export function get_machines_by_tag(tag: machine_category | 'all' | 'untagged'): machine[]
{
    if (tag === 'all')
    {
        return [...machine_list];
    }
    if (tag === 'untagged')
    {
        return machine_list.filter((m) => !m.tags.some((t) => _known_tag_set.has(t)));
    }
    return machine_list.filter((m) => m.tags.includes(tag));
}

