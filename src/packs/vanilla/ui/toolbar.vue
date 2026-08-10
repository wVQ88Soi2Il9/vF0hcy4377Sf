<template>
    <div class="toolbar">
        <!-- 工具選擇 -->
        <div class="tool-group">
            <button
                v-for="t in tools"
                :key="t.mode"
                :class="['tool-btn', { active: state.tool === t.mode }]"
                :title="t.label"
                @click="set_tool(t.mode)"
            >
                <span class="tool-icon">{{ t.icon }}</span>
                <span class="tool-label">{{ t.label }}</span>
            </button>
        </div>

        <div class="divider" />

        <!-- 設備列表（place 模式用） -->
        <div class="device-group">
            <p class="group-label">設備</p>
            <button
                v-for="def in device_defs"
                :key="def.id"
                :class="['device-btn', { active: state.placing_def_id === def.id }]"
                :title="def.id"
                @click="set_placing_def(def.id)"
            >
                {{ def.id.split(':').pop() }}
            </button>
        </div>

        <div class="divider" />

        <!-- Layer 切換 -->
        <div class="layer-group">
            <p class="group-label">層 (Z)</p>
            <div class="layer-controls">
                <button class="layer-btn" @click="state.current_layer--">▼</button>
                <span class="layer-val">{{ state.current_layer }}</span>
                <button class="layer-btn" @click="state.current_layer++">▲</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { device_definition } from '@/core/types'
import { use_editor_state, set_tool, set_placing_def } from './use_editor_state'
import type { tool_mode } from './use_editor_state'

// ── Props ─────────────────────────────────────────────────────────────────────
defineProps<
{
    device_defs: device_definition[]
}>()

// ── State ─────────────────────────────────────────────────────────────────────
const state = use_editor_state()

const tools: { mode: tool_mode; icon: string; label: string }[] =
[
    { mode: 'select', icon: '▶', label: '選取' },
    { mode: 'place',  icon: '＋', label: '放置' },
    { mode: 'delete', icon: '✕', label: '刪除' }
]
</script>

<style scoped>
.toolbar
{
    position:        absolute;
    left:            16px;
    top:             50%;
    transform:       translateY(-50%);
    display:         flex;
    flex-direction:  column;
    gap:             8px;
    background:      rgba(15, 23, 42, 0.85);
    border:          1px solid rgba(56, 189, 248, 0.2);
    border-radius:   12px;
    padding:         12px 8px;
    backdrop-filter: blur(12px);
    min-width:       80px;
    user-select:     none;
}

.tool-group,
.device-group,
.layer-group
{
    display:        flex;
    flex-direction: column;
    gap:            4px;
}

.group-label
{
    font-size:    10px;
    color:        #64748b;
    text-align:   center;
    margin:       0 0 2px;
    font-family:  monospace;
}

.tool-btn,
.device-btn
{
    display:         flex;
    flex-direction:  column;
    align-items:     center;
    gap:             2px;
    background:      rgba(30, 41, 59, 0.6);
    border:          1px solid transparent;
    border-radius:   8px;
    padding:         8px 6px;
    color:           #94a3b8;
    cursor:          pointer;
    transition:      all 0.15s ease;
    font-family:     monospace;
    font-size:       11px;
}

.tool-btn:hover,
.device-btn:hover
{
    background:  rgba(56, 189, 248, 0.12);
    border-color: rgba(56, 189, 248, 0.3);
    color:        #e2e8f0;
}

.tool-btn.active,
.device-btn.active
{
    background:   rgba(56, 189, 248, 0.2);
    border-color: #38bdf8;
    color:        #38bdf8;
}

.tool-icon { font-size: 16px; }
.tool-label { font-size: 10px; }

.divider
{
    height:     1px;
    background: rgba(56, 189, 248, 0.15);
    margin:     2px 0;
}

.layer-controls
{
    display:     flex;
    align-items: center;
    gap:         4px;
    justify-content: center;
}

.layer-btn
{
    background:   rgba(30, 41, 59, 0.6);
    border:       1px solid rgba(56, 189, 248, 0.2);
    border-radius: 4px;
    color:        #94a3b8;
    cursor:       pointer;
    padding:      2px 6px;
    font-size:    12px;
    transition:   all 0.15s;
}
.layer-btn:hover { color: #38bdf8; border-color: #38bdf8; }

.layer-val
{
    color:       #e2e8f0;
    font-family: monospace;
    font-size:   14px;
    min-width:   20px;
    text-align:  center;
}
</style>
