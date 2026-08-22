/**
 * 建造計畫資料
 *
 * `-1` 在 TypeScript 面轉成 `null`（無上限）。
 */

import type { plan } from '../types';

/**
 * 所有可選建造計畫資料（武陵 / 四號谷地 等）。
 */
export const plans: plan[] = [
    {
        id:             '7dd94e87-a806-4035-9644-63eb99f76f75',
        name:           '四號谷地',
        material_rates: [
            {
                name: '源礦',
                rate: 560
            },
            {
                name: '紫晶礦',
                rate: 240
            },
            {
                name: '藍鐵礦',
                rate: 1080
            },
            {
                name: '蕎花',
                rate: null
            },
            {
                name: '柑實',
                rate: null
            },
            {
                name: '砂葉',
                rate: null
            },
            {
                name: '酮化灌木',
                rate: null
            },
            {
                name: '錦草',
                rate: null
            },
            {
                name: '芽針',
                rate: null
            }
        ],
        machine_limits: [
            {
                name:  '塑型機',
                limit: null
            },
            {
                name:  '灌裝機',
                limit: null
            },
            {
                name:  '精煉爐',
                limit: null
            },
            {
                name:  '粉碎機',
                limit: null
            },
            {
                name:  '配件機',
                limit: null
            },
            {
                name:  '裝備原件機',
                limit: null
            },
            {
                name:  '封裝機',
                limit: null
            },
            {
                name:  '研磨機',
                limit: null
            }
        ],
        product_values: [
            {
                name:  '精選蕎癒膠囊',
                price: 70
            },
            {
                name:  '高容量谷地電池',
                price: 70
            },
            {
                name:  '精選柑實罐頭',
                price: 70
            },
            {
                name:  '中容量谷地電池',
                price: 30
            },
            {
                name:  '優質蕎癒膠囊',
                price: 27
            },
            {
                name:  '優質柑實罐頭',
                price: 27
            },
            {
                name:  '蕎癒膠囊',
                price: 10
            },
            {
                name:  '柑實罐頭',
                price: 10
            },
            {
                name:  '紫晶質瓶',
                price: 2
            },
            {
                name:  '晶體外殼',
                price: 1
            },
            {
                name:  '紫晶零件',
                price: 1
            },
            {
                name:  '低容量谷地電池',
                price: 16
            },
            {
                name:  '鐵製零件',
                price: 1
            },
            {
                name:  '鋼製零件',
                price: 1
            }
        ],
        priority_products: [
            {
                name:     '高容量谷地電池',
                max_rate: null
            }
        ],
        transport_items: []
    },
    {
        id:             '9bdb2f99-531e-416a-8f4c-27c5e8d8957c',
        name:           '武陵',
        material_rates: [
            {
                name: '源礦',
                rate: 540
            },
            {
                name: '紫晶礦',
                rate: 0
            },
            {
                name: '藍鐵礦',
                rate: 120
            },
            {
                name: '赤銅礦',
                rate: 420
            },
            {
                name: '蕎花',
                rate: null
            },
            {
                name: '柑實',
                rate: null
            },
            {
                name: '砂葉',
                rate: null
            },
            {
                name: '酮化灌木',
                rate: null
            },
            {
                name: '錦草',
                rate: null
            },
            {
                name: '芽針',
                rate: null
            },
            {
                name: '清水',
                rate: null
            },
            {
                name: '沉積酸',
                rate: null
            },
            {
                name: '息壤氣',
                rate: 100
            },
            {
                name: '惰氣',
                rate: 460
            }
        ],
        machine_limits: [
            {
                name:  '塑型機',
                limit: null
            },
            {
                name:  '灌裝機',
                limit: null
            },
            {
                name:  '精煉爐',
                limit: null
            },
            {
                name:  '粉碎機',
                limit: null
            },
            {
                name:  '配件機',
                limit: null
            },
            {
                name:  '裝備原件機',
                limit: null
            },
            {
                name:  '封裝機',
                limit: null
            },
            {
                name:  '研磨機',
                limit: null
            },
            {
                name:  '反應池',
                limit: null
            },
            {
                name:  '天有洪爐',
                limit: 12
            },
            {
                name:  '提純機',
                limit: null
            },
            {
                name:  '拆解機',
                limit: null
            },
            {
                name:  '物品准入口',
                limit: null
            },
            {
                name:  '分流器',
                limit: null
            },
            {
                name:  '物流橋',
                limit: null
            },
            {
                name:  '匯流器',
                limit: null
            },
            {
                name:  '管道准入口',
                limit: null
            },
            {
                name:  '管道分流器',
                limit: null
            },
            {
                name:  '管道橋',
                limit: null
            },
            {
                name:  '管道匯流器',
                limit: null
            },
            {
                name:  '協議儲存箱',
                limit: null
            },
            {
                name:  '倉庫存貨口',
                limit: null
            },
            {
                name:  '倉庫取貨口',
                limit: null
            },
            {
                name:  '儲液罐',
                limit: null
            },
            {
                name:  '倉庫存取線基段',
                limit: null
            },
            {
                name:  '倉庫存取線源樁',
                limit: null
            },
            {
                name:  '暗管入口',
                limit: null
            },
            {
                name:  '暗管出口',
                limit: null
            },
            {
                name:  '多口暗管入口',
                limit: null
            },
            {
                name:  '多口暗管出口',
                limit: null
            },
            {
                name:  '採種機',
                limit: null
            },
            {
                name:  '種植機',
                limit: null
            },
            {
                name:  '廢水處理機',
                limit: null
            },
            {
                name:  '擴容反應池',
                limit: null
            },
            {
                name:  '供電樁',
                limit: null
            },
            {
                name:  '息壤供電樁',
                limit: null
            },
            {
                name:  '中繼器',
                limit: null
            },
            {
                name:  '息壤中繼器',
                limit: null
            },
            {
                name:  '熱能池',
                limit: null
            },
            {
                name:  '液氣轉化機',
                limit: null
            },
            {
                name:  '固氣轉化機',
                limit: null
            },
            {
                name:  '氣體反應爐',
                limit: null
            },
            {
                name:  '氣體散布機',
                limit: null
            }
        ],
        product_values: [
            {
                name:  '中容量武陵電池',
                price: 54
            },
            {
                name:  '優質芽針針劑',
                price: 22
            },
            {
                name:  '赫銅零件',
                price: 48
            },
            {
                name:  '低容量谷地電池',
                price: 25
            },
            {
                name:  '芽針針劑',
                price: 16
            },
            {
                name:  '赤銅零件',
                price: 1
            },
            {
                name:  '息壤',
                price: 1
            },
            {
                name:  '重息壤',
                price: 27
            },
            {
                name:  '優質錦草飲料',
                price: 22
            },
            {
                name:  '錦草飲料',
                price: 16
            },
            {
                name:  '灼銅零件',
                price: 70
            },
            {
                name:  '分離芯',
                price: 1
            }
        ],
        priority_products: [],
        transport_items:   []
    }
];

const _plan_map = new Map<string, plan>(plans.map((p) => [p.id, p]));
const _plan_by_name_map = new Map<string, plan>(plans.map((p) => [p.name, p]));

/** 依 UUID 查計畫 */
export function get_plan(id: string): plan | undefined
{
    return _plan_map.get(id);
}

/** 依中文名稱查計畫 */
export function get_plan_by_name(name: string): plan | undefined
{
    return _plan_by_name_map.get(name);
}

/** 取得所有計畫副本 */
export function get_all_plans(): plan[]
{
    return [...plans];
}
