import type { game_map, device_node, device_definition } from '@/core/types'
import type { camera } from './camera'
import { grid_to_screen } from './camera'
import { get_world_ports } from '@/utils/device_utils'

const COLOR_EDGE         = '#38bdf8'
const COLOR_EDGE_HOVER   = '#facc15'

/**
 * 繪製所有設備之間的連線（根據 device_node graph）。
 *
 * 連線畫在兩台設備「相接的 port 位置」，而非從中心拉線。
 * 我們找出 A 的 output port 與 B 的 input port 中，
 * 世界座標相同的那一組，連一條曲線。
 */
export function draw_all_connections(
    ctx:           CanvasRenderingContext2D,
    cam:           camera,
    map:           game_map,
    nodes:         device_node[],
    registry_defs: Map<string, device_definition>
): void
{
    // 建立 unique_id → device 快查表
    const dev_map = new Map(map.devices.map(d => [d.unique_id, d]))

    for (const node of nodes)
    {
        const src_dev = dev_map.get(node.unique_id)
        if (!src_dev) { continue }

        const src_def = registry_defs.get(src_dev.definition_id)
        if (!src_def) { continue }

        for (const next_id of node.next_nodes)
        {
            const dst_dev = dev_map.get(next_id)
            if (!dst_dev) { continue }

            const dst_def = registry_defs.get(dst_dev.definition_id)
            if (!dst_def) { continue }

            draw_connection(ctx, cam, src_dev, src_def, dst_dev, dst_def)
        }
    }
}

/**
 * 在兩台設備之間畫一條貝茲曲線箭頭。
 * 起點 = src 的 output port，終點 = dst 的 input port（兩者世界座標相同）。
 */
function draw_connection(
    ctx:     CanvasRenderingContext2D,
    cam:     camera,
    src_dev: ReturnType<typeof Object.values<any>>[number],
    src_def: device_definition,
    dst_dev: ReturnType<typeof Object.values<any>>[number],
    dst_def: device_definition
): void
{
    // 從 src 的 anchor 出發，到 dst 的 anchor 結束，畫一條曲線
    // （更精確的做法是找到匹配的 port，這裡先用 anchor 示意）
    const { sx: x1, sy: y1 } = grid_to_screen(cam, src_dev.position.x, src_dev.position.y)
    const { sx: x2, sy: y2 } = grid_to_screen(cam, dst_dev.position.x, dst_dev.position.y)

    const dx = x2 - x1
    const dy = y2 - y1

    // 控制點：往水平方向彎曲，讓曲線看起來更有方向感
    const cp1x = x1 + dx * 0.4
    const cp1y = y1
    const cp2x = x2 - dx * 0.4
    const cp2y = y2

    ctx.save()
    ctx.strokeStyle = COLOR_EDGE
    ctx.lineWidth   = 2
    ctx.setLineDash([6, 4])
    ctx.globalAlpha = 0.75

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2)
    ctx.stroke()

    // ── 箭頭頭部 ────────────────────────────────────────────────────────────
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    draw_arrowhead(ctx, x2, y2, Math.atan2(y2 - cp2y, x2 - cp2x), COLOR_EDGE)

    ctx.restore()
}

/** 在終點畫一個小三角箭頭 */
function draw_arrowhead(
    ctx:   CanvasRenderingContext2D,
    x:     number,
    y:     number,
    angle: number,
    color: string
): void
{
    const size = 10
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.moveTo(0, 0)
    ctx.lineTo(-size, -size / 2)
    ctx.lineTo(-size, size / 2)
    ctx.closePath()
    ctx.fill()
    ctx.setTransform(1, 0, 0, 1, 0, 0)   // reset transform
}
