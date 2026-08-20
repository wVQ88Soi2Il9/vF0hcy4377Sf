export interface ef_plan
{
    id:             string;
    name:           string;
    material_rates: Array<{ name: string; rate: number | null }>;
    machine_limits: Array<{ name: string; limit: number | null }>;
    product_values: Array<{ name: string; price: number }>;
}

export const ef_plans: ef_plan[] = [
    {
        "id": "7dd94e87-a806-4035-9644-63eb99f76f75",
        "name": "四號谷地",
        "material_rates": [
            {
                "name": "源礦",
                "rate": 560
            },
            {
                "name": "紫晶礦",
                "rate": 240
            },
            {
                "name": "藍鐵礦",
                "rate": 1080
            },
            {
                "name": "蕎花",
                "rate": -1
            },
            {
                "name": "柑實",
                "rate": -1
            },
            {
                "name": "砂葉",
                "rate": -1
            },
            {
                "name": "酮化灌木",
                "rate": -1
            },
            {
                "name": "錦草",
                "rate": -1
            },
            {
                "name": "芽針",
                "rate": -1
            }
        ],
        "machine_limits": [
            {
                "name": "塑型機",
                "limit": -1
            },
            {
                "name": "灌裝機",
                "limit": -1
            },
            {
                "name": "精煉爐",
                "limit": -1
            },
            {
                "name": "粉碎機",
                "limit": -1
            },
            {
                "name": "配件機",
                "limit": -1
            },
            {
                "name": "裝備原件機",
                "limit": -1
            },
            {
                "name": "封裝機",
                "limit": -1
            },
            {
                "name": "研磨機",
                "limit": -1
            }
        ],
        "product_values": [
            {
                "name": "精選蕎癒膠囊",
                "price": 70
            },
            {
                "name": "高容量谷地電池",
                "price": 70
            },
            {
                "name": "精選柑實罐頭",
                "price": 70
            },
            {
                "name": "中容量谷地電池",
                "price": 30
            },
            {
                "name": "優質蕎癒膠囊",
                "price": 27
            },
            {
                "name": "優質柑實罐頭",
                "price": 27
            },
            {
                "name": "蕎癒膠囊",
                "price": 10
            },
            {
                "name": "柑實罐頭",
                "price": 10
            },
            {
                "name": "紫晶質瓶",
                "price": 2
            },
            {
                "name": "晶體外殼",
                "price": 1
            },
            {
                "name": "紫晶零件",
                "price": 1
            },
            {
                "name": "低容量谷地電池",
                "price": 16
            },
            {
                "name": "鐵製零件",
                "price": 1
            },
            {
                "name": "鋼製零件",
                "price": 1
            }
        ],
        "priority_products": [
            {
                "name": "高容量谷地電池",
                "max_rate": -1
            }
        ]
    },
    {
        "id": "9bdb2f99-531e-416a-8f4c-27c5e8d8957c",
        "name": "武陵",
        "material_rates": [
            {
                "name": "源礦",
                "rate": 540
            },
            {
                "name": "紫晶礦",
                "rate": 0
            },
            {
                "name": "藍鐵礦",
                "rate": 120
            },
            {
                "name": "赤銅礦",
                "rate": 420
            },
            {
                "name": "蕎花",
                "rate": -1
            },
            {
                "name": "柑實",
                "rate": -1
            },
            {
                "name": "砂葉",
                "rate": -1
            },
            {
                "name": "酮化灌木",
                "rate": -1
            },
            {
                "name": "錦草",
                "rate": -1
            },
            {
                "name": "芽針",
                "rate": -1
            },
            {
                "name": "清水",
                "rate": -1
            },
            {
                "name": "沉積酸",
                "rate": -1
            },
            {
                "name": "息壤氣",
                "rate": 100
            },
            {
                "name": "惰氣",
                "rate": 460
            }
        ],
        "machine_limits": [
            {
                "name": "塑型機",
                "limit": -1
            },
            {
                "name": "灌裝機",
                "limit": -1
            },
            {
                "name": "精煉爐",
                "limit": -1
            },
            {
                "name": "粉碎機",
                "limit": -1
            },
            {
                "name": "配件機",
                "limit": -1
            },
            {
                "name": "裝備原件機",
                "limit": -1
            },
            {
                "name": "封裝機",
                "limit": -1
            },
            {
                "name": "研磨機",
                "limit": -1
            },
            {
                "name": "反應池",
                "limit": -1
            },
            {
                "name": "天有洪爐",
                "limit": 12
            },
            {
                "name": "提純機",
                "limit": -1
            },
            {
                "name": "拆解機",
                "limit": -1
            },
            {
                "name": "物品准入口",
                "limit": -1
            },
            {
                "name": "分流器",
                "limit": -1
            },
            {
                "name": "物流橋",
                "limit": -1
            },
            {
                "name": "匯流器",
                "limit": -1
            },
            {
                "name": "管道准入口",
                "limit": -1
            },
            {
                "name": "管道分流器",
                "limit": -1
            },
            {
                "name": "管道橋",
                "limit": -1
            },
            {
                "name": "管道匯流器",
                "limit": -1
            },
            {
                "name": "協議儲存箱",
                "limit": -1
            },
            {
                "name": "倉庫存貨口",
                "limit": -1
            },
            {
                "name": "倉庫取貨口",
                "limit": -1
            },
            {
                "name": "儲液罐",
                "limit": -1
            },
            {
                "name": "倉庫存取線基段",
                "limit": -1
            },
            {
                "name": "倉庫存取線源樁",
                "limit": -1
            },
            {
                "name": "暗管入口",
                "limit": -1
            },
            {
                "name": "暗管出口",
                "limit": -1
            },
            {
                "name": "多口暗管入口",
                "limit": -1
            },
            {
                "name": "多口暗管出口",
                "limit": -1
            },
            {
                "name": "採種機",
                "limit": -1
            },
            {
                "name": "種植機",
                "limit": -1
            },
            {
                "name": "廢水處理機",
                "limit": -1
            },
            {
                "name": "擴容反應池",
                "limit": -1
            },
            {
                "name": "供電樁",
                "limit": -1
            },
            {
                "name": "息壤供電樁",
                "limit": -1
            },
            {
                "name": "中繼器",
                "limit": -1
            },
            {
                "name": "息壤中繼器",
                "limit": -1
            },
            {
                "name": "熱能池",
                "limit": -1
            },
            {
                "name": "液氣轉化機",
                "limit": -1
            },
            {
                "name": "固氣轉化機",
                "limit": -1
            },
            {
                "name": "氣體反應爐",
                "limit": -1
            },
            {
                "name": "氣體散布機",
                "limit": -1
            }
        ],
        "product_values": [
            {
                "name": "中容量武陵電池",
                "price": 54
            },
            {
                "name": "優質芽針針劑",
                "price": 22
            },
            {
                "name": "赫銅零件",
                "price": 48
            },
            {
                "name": "低容量谷地電池",
                "price": 25
            },
            {
                "name": "芽針針劑",
                "price": 16
            },
            {
                "name": "赤銅零件",
                "price": 1
            },
            {
                "name": "息壤",
                "price": 1
            },
            {
                "name": "重息壤",
                "price": 27
            },
            {
                "name": "優質錦草飲料",
                "price": 22
            },
            {
                "name": "錦草飲料",
                "price": 16
            },
            {
                "name": "灼銅零件",
                "price": 70
            },
            {
                "name": "分離芯",
                "price": 1
            }
        ],
        "priority_products": [],
        "transport_items": []
    }
];
