import { reactive } from 'vue'
import type { vector } from '@/core/types'

// ── 工具模式 ──────────────────────────────────────────────────────────────────

export type tool_mode = 'select' | 'place' | 'delete'

// ── 編輯器狀態 ────────────────────────────────────────────────────────────────

export interface editor_state
{
    /** 目前的工具模式 */
    tool:             tool_mode

    /** 選中的設備 unique_id（select 模式下） */
    selected_id:      number | null

    /** place 模式下要放置的 definition id */
    placing_def_id:   string | null

    /** 滑鼠目前指向的 grid 座標（雙倍精度） */
    cursor_grid_pos:  { gx: number; gy: number } | null

    /** 目前的 z 層（layer 切換） */
    current_layer:    number
}

// ── 單例 reactive 狀態（整個 vanilla UI 共用） ───────────────────────────────

const state = reactive<editor_state>(
{
    tool:            'select',
    selected_id:     null,
    placing_def_id:  null,
    cursor_grid_pos: null,
    current_layer:   0
})

// ── 公開 composable ───────────────────────────────────────────────────────────

export function use_editor_state()
{
    return state
}

// ── Action helpers（讓模板不用直接 mutate，保持可讀性） ─────────────────────

export function set_tool(tool: tool_mode): void
{
    state.tool = tool
    if (tool !== 'select') { state.selected_id = null }
    if (tool !== 'place')  { state.placing_def_id = null }
}

export function set_placing_def(def_id: string): void
{
    state.placing_def_id = def_id
    state.tool = 'place'
}

export function set_selected(id: number | null): void
{
    state.selected_id = id
    state.tool = 'select'
}

export function set_cursor_pos(pos: { gx: number; gy: number } | null): void
{
    state.cursor_grid_pos = pos
}
