/**
 * 相機狀態。
 * pan_x / pan_y 是畫面原點（grid 座標 0,0）對應的螢幕像素偏移。
 * zoom 是每個「真實格子」（interval=2 的雙倍格）換算成多少像素。
 */
export interface camera
{
    pan_x: number
    pan_y: number
    zoom:  number
}

/** 建立一個預設相機，將 grid (0,0) 放在畫布中央附近 */
export function create_camera(canvas_w: number, canvas_h: number): camera
{
    return {
        pan_x: canvas_w / 2,
        pan_y: canvas_h / 2,
        zoom:  64
    }
}

/**
 * 將 grid 座標（雙倍精度，偶數為格子中心）換算成螢幕像素。
 * grid 間距是 2，所以除以 2 再乘 zoom。
 */
export function grid_to_screen(cam: camera, gx: number, gy: number): { sx: number; sy: number }
{
    return {
        sx: cam.pan_x + (gx / 2) * cam.zoom,
        sy: cam.pan_y + (gy / 2) * cam.zoom
    }
}

/**
 * 將螢幕像素反算回最近的 grid 格子中心座標（偶數）。
 */
export function screen_to_grid(cam: camera, sx: number, sy: number): { gx: number; gy: number }
{
    const raw_x = ((sx - cam.pan_x) / cam.zoom) * 2
    const raw_y = ((sy - cam.pan_y) / cam.zoom) * 2
    return {
        gx: Math.round(raw_x / 2) * 2,
        gy: Math.round(raw_y / 2) * 2
    }
}
