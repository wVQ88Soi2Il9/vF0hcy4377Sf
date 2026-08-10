<template>
    <!-- 狀態列：固定在畫面底部，顯示 debug 資訊 -->
    <div class="status-bar">
        <span class="stat">
            工具：<strong>{{ tool_label }}</strong>
        </span>
        <span class="sep">|</span>
        <span class="stat">
            游標：
            <span class="mono" v-if="state.cursor_grid_pos">
                ({{ state.cursor_grid_pos.gx }}, {{ state.cursor_grid_pos.gy }})
            </span>
            <span class="mono muted" v-else>—</span>
        </span>
        <span class="sep">|</span>
        <span class="stat">
            Layer Z = <strong>{{ state.current_layer }}</strong>
        </span>
        <span class="sep">|</span>
        <span class="stat">
            設備數：<strong>{{ device_count }}</strong>
        </span>
        <span class="sep">|</span>
        <span class="stat muted">
            Zoom {{ zoom_pct }}%
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use_editor_state } from './use_editor_state'

// ── Props ─────────────────────────────────────────────────────────────────────
const props = defineProps<
{
    device_count: number
    zoom:         number
}>()

// ── State ─────────────────────────────────────────────────────────────────────
const state = use_editor_state()

const tool_label = computed(() =>
{
    const labels = { select: '選取', place: '放置', delete: '刪除' }
    return labels[state.tool]
})

const zoom_pct = computed(() => Math.round(props.zoom))
</script>

<style scoped>
.status-bar
{
    position:        absolute;
    bottom:          0;
    left:            0;
    right:           0;
    height:          32px;
    display:         flex;
    align-items:     center;
    gap:             10px;
    padding:         0 16px;
    background:      rgba(15, 23, 42, 0.9);
    border-top:      1px solid rgba(56, 189, 248, 0.12);
    backdrop-filter: blur(8px);
    font-size:       12px;
    color:           #94a3b8;
    font-family:     system-ui, sans-serif;
    user-select:     none;
}

strong { color: #e2e8f0; }
.mono { font-family: monospace; color: #38bdf8; }
.muted { color: #475569; }
.sep { color: #334155; }
</style>
