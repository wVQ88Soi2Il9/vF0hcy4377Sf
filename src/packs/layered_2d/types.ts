import type { device } from '@/API';
import type { drawable_device } from '@/packs/basic_renderer';

/**
 * 2.5D 空間向量，強制為長度為 3 的 [x, y, z] 格式。
 * x, y 為水平網格座標，z 為離散高程層級 (0, 1, ..., n)。
 */
export type vector_3d = [number, number, number];

/**
 * 2.5D 水平主平面 4 向正交旋轉狀態（循環群 C4）。
 * 0 = 朝右 (+X, 0°)
 * 1 = 朝上 (+Y, 90°)
 * 2 = 朝左 (-X, 180°)
 * 3 = 朝下 (-Y, 270°)
 */
export type rotation_step = 0 | 1 | 2 | 3;

/**
 * 二面體群 D4 幾何變換狀態 (Dihedral Group of Order 8)。
 * 由 4 個純旋轉 (rotation: 0..3) 與鏡射翻轉 (flipped: boolean) 構成。
 */
export interface d4_transform
{
    /** 水平旋轉步數 (0: 0°, 1: 90°, 2: 180°, 3: 270°) */
    rotation: rotation_step;

    /** 是否沿 X 軸鏡射翻轉 (y → -y) */
    flipped:  boolean;
}

/**
 * 2.5D 分層視圖相機設定。
 */
export interface layered_camera
{
    pan_x:                number;
    pan_y:                number;
    zoom:                 number;
    /** 當前焦點/編輯層級 z (Active Layer) */
    active_layer:         number;
    /** 是否顯示非焦點層（透視/疊加） */
    show_inactive_layers: boolean;
    /** 非焦點層透明度 (0.0 ~ 1.0) */
    inactive_alpha:       number;
}

/**
 * 2.5D D4 幾何變換能力介面契約 (Capability Interface)
 * 供下游裝置實作，支援 2.5D 水平主平面之二面體群 D4 (旋轉與翻轉) 變換。
 */
export interface rotatable_device extends device
{
    /** 當前 D4 變換狀態 */
    transform: d4_transform;

    /** 旋轉裝置（steps: 1 為逆時針 90°，-1 為順時針 90°） */
    rotate(steps?: number): void;

    /** 鏡射翻轉裝置 */
    flip(): void;

    /** 直接指定 D4 變換狀態 */
    set_transform(transform: d4_transform): void;
}

/**
 * 2.5D 分層裝置能力介面契約 (Capability Interface)
 * 規範下游裝置必須具備 2.5D 專屬形狀、端口與層級特性。
 */
export interface layered_device extends device
{
    /** 取得裝置所屬層級 z (通常對應 position[2]) */
    get_layer(): number;

    /** 取得符合 [x, y, z] 格式之局部形狀格點 */
    get_shape_3d(): vector_3d[];

    /** 取得符合 [x, y, z] 格式之局部連接埠 */
    get_port_3d(type: 'input' | 'output'): vector_3d[];
}

/**
 * 2.5D 分層裝置繪製能力介面契約 (Capability Interface)
 * 繼承 basic_renderer 的 draw() 契約與 2.5D 專屬形狀規範。
 */
export interface drawable_layered_device extends drawable_device, layered_device
{
    /** 可選：專屬的 2.5D 分層繪製方法 */
    draw_layered?
    (
        ctx:    CanvasRenderingContext2D,
        sx:     number,
        sy:     number,
        sw:     number,
        sh:     number,
        zoom:   number,
        camera: layered_camera
    ): void;
}
