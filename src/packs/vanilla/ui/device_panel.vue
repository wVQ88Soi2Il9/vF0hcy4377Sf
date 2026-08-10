<template>
    <div v-if="device" class="device-panel">
        <h2 class="panel-title">設備資訊</h2>

        <div class="field">
            <span class="field-label">ID</span>
            <span class="field-value mono">{{ device.unique_id }}</span>
        </div>

        <div class="field">
            <span class="field-label">類型</span>
            <span class="field-value mono">{{ device.definition_id }}</span>
        </div>

        <div class="field">
            <span class="field-label">位置</span>
            <span class="field-value mono">
                ({{ device.position.x }}, {{ device.position.y }}, {{ device.position.z }})
            </span>
        </div>

        <div class="field">
            <span class="field-label">旋轉</span>
            <span class="field-value mono">
                Z={{ device.rotation.z * 90 }}°
            </span>
        </div>

        <!-- 配方選擇（如果此設備有配方） -->
        <div v-if="available_recipes.length > 0" class="recipe-section">
            <p class="section-label">配方</p>
            <select
                class="recipe-select"
                :value="device.selected_recipe_id ?? ''"
                @change="on_recipe_change"
            >
                <option value="">— 未選擇 —</option>
                <option
                    v-for="r in available_recipes"
                    :key="r.id"
                    :value="r.id"
                >
                    {{ r.id.split(':').pop() }}
                </option>
            </select>

            <!-- 顯示選中配方的輸入/輸出 -->
            <div v-if="selected_recipe" class="recipe-detail">
                <div class="io-row">
                    <span class="io-label">輸入</span>
                    <span
                        v-for="s in selected_recipe.inputs"
                        :key="s.item_id"
                        class="item-chip"
                    >
                        {{ s.item_id.split(':').pop() }} ×{{ s.quantity }}
                    </span>
                </div>
                <div class="io-arrow">↓</div>
                <div class="io-row">
                    <span class="io-label">輸出</span>
                    <span
                        v-for="s in selected_recipe.outputs"
                        :key="s.item_id"
                        class="item-chip output"
                    >
                        {{ s.item_id.split(':').pop() }} ×{{ s.quantity }}
                    </span>
                </div>
            </div>
        </div>

        <!-- 刪除按鈕 -->
        <button class="delete-btn" @click="emit('delete', device.unique_id)">
            ✕ 刪除設備
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { device, device_definition, recipe } from '@/core/types'

// ── Props & Emits ─────────────────────────────────────────────────────────────
const props = defineProps<
{
    device:       device | null
    all_defs:     Map<string, device_definition>
    all_recipes:  Map<string, recipe>
}>()

const emit = defineEmits<
{
    (e: 'delete',        id:         number): void
    (e: 'recipe_change', device_id:  number, recipe_id: string | undefined): void
}>()

// ── Computed ──────────────────────────────────────────────────────────────────

const definition = computed(() =>
    props.device ? props.all_defs.get(props.device.definition_id) : null
)

const available_recipes = computed((): recipe[] =>
{
    if (!definition.value) { return [] }
    return definition.value.recipe_ids
        .map(rid => props.all_recipes.get(rid))
        .filter((r): r is recipe => r !== undefined)
})

const selected_recipe = computed(() =>
    props.device?.selected_recipe_id
        ? props.all_recipes.get(props.device.selected_recipe_id)
        : null
)

// ── Handlers ──────────────────────────────────────────────────────────────────

function on_recipe_change(e: Event): void
{
    if (!props.device) { return }
    const val = (e.target as HTMLSelectElement).value
    emit('recipe_change', props.device.unique_id, val || undefined)
}
</script>

<style scoped>
.device-panel
{
    position:        absolute;
    right:           16px;
    top:             50%;
    transform:       translateY(-50%);
    background:      rgba(15, 23, 42, 0.88);
    border:          1px solid rgba(250, 204, 21, 0.3);
    border-radius:   12px;
    padding:         16px;
    min-width:       220px;
    backdrop-filter: blur(12px);
    display:         flex;
    flex-direction:  column;
    gap:             10px;
    color:           #e2e8f0;
    font-family:     system-ui, sans-serif;
    font-size:       13px;
}

.panel-title
{
    font-size:   14px;
    font-weight: 600;
    color:       #facc15;
    margin:      0;
    border-bottom: 1px solid rgba(250, 204, 21, 0.2);
    padding-bottom: 8px;
}

.field
{
    display:         flex;
    justify-content: space-between;
    align-items:     center;
    gap:             8px;
}

.field-label
{
    color:     #64748b;
    font-size: 11px;
}

.field-value { color: #e2e8f0; }
.mono { font-family: monospace; font-size: 12px; }

.section-label
{
    font-size: 11px;
    color:     #64748b;
    margin:    0 0 6px;
}

.recipe-section
{
    display:        flex;
    flex-direction: column;
    gap:            6px;
    border-top:     1px solid rgba(56, 189, 248, 0.1);
    padding-top:    10px;
}

.recipe-select
{
    width:        100%;
    background:   rgba(30, 41, 59, 0.8);
    border:       1px solid rgba(56, 189, 248, 0.3);
    border-radius: 6px;
    color:        #e2e8f0;
    padding:      6px 8px;
    font-size:    12px;
    font-family:  monospace;
    cursor:       pointer;
}

.recipe-detail
{
    display:        flex;
    flex-direction: column;
    gap:            4px;
    background:     rgba(30, 41, 59, 0.5);
    border-radius:  6px;
    padding:        8px;
}

.io-row
{
    display:    flex;
    flex-wrap:  wrap;
    gap:        4px;
    align-items: center;
}

.io-label
{
    font-size:  10px;
    color:      #64748b;
    min-width:  28px;
}

.io-arrow { text-align: center; color: #64748b; font-size: 12px; }

.item-chip
{
    background:    rgba(74, 222, 128, 0.15);
    border:        1px solid rgba(74, 222, 128, 0.3);
    border-radius: 4px;
    padding:       2px 6px;
    font-size:     11px;
    font-family:   monospace;
    color:         #4ade80;
}
.item-chip.output
{
    background: rgba(249, 115, 22, 0.15);
    border-color: rgba(249, 115, 22, 0.3);
    color:       #f97316;
}

.delete-btn
{
    background:   rgba(239, 68, 68, 0.12);
    border:       1px solid rgba(239, 68, 68, 0.4);
    border-radius: 8px;
    color:        #ef4444;
    cursor:       pointer;
    padding:      8px;
    font-size:    12px;
    transition:   all 0.15s;
    margin-top:   4px;
}
.delete-btn:hover
{
    background:  rgba(239, 68, 68, 0.25);
    border-color: #ef4444;
}
</style>
