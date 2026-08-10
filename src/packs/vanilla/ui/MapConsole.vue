<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import type { game_map } from '@/core/types'
import type { pack_registry } from '@/core/pack_manager'
import { draw_map, create_default_camera } from '@/packs/vanilla/renderer/draw_map.ts'
import { execute_command } from '@/packs/vanilla/ui/command_parser'

const props = defineProps<{
    map:       game_map
    registry:  pack_registry
}>()

const canvas_ref  = ref<HTMLCanvasElement | null>(null)
const command_ref = ref<HTMLInputElement | null>(null)

const cam = reactive(create_default_camera())

const command_input = ref('')
const command_log = ref<{ text: string; ok: boolean }[]>([])

function redraw(): void
{
    const canvas = canvas_ref.value
    if (!canvas)
    {
        return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx)
    {
        return
    }

    draw_map(ctx, props.map, props.registry, cam)
}

function on_scale_input(event: Event): void
{
    const value = Number((event.target as HTMLInputElement).value)
    cam.scale = value
    redraw()
}

function submit_command(): void
{
    const line = command_input.value
    if (line.trim().length === 0)
    {
        return
    }

    const result = execute_command(line, props.map, props.registry)
    command_log.value.unshift({ text: `> ${line}`, ok: true })
    command_log.value.unshift({ text: result.message, ok: result.ok })

    if (result.ok)
    {
        command_input.value = ''
        redraw()
    }
}

function resize_canvas(): void
{
    const canvas = canvas_ref.value
    if (!canvas)
    {
        return
    }

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    redraw()
}

onMounted(() =>
{
    resize_canvas()
    window.addEventListener('resize', resize_canvas)
    command_ref.value?.focus()
})

watch(() => props.map.devices.length, redraw)
</script>

<template>
  <div class="map-console">
    <div class="toolbar">
      <label class="scale-control">
        Scale
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.05"
          :value="cam.scale"
          @input="on_scale_input"
        />
        <span class="scale-value">{{ cam.scale.toFixed(2) }}x</span>
      </label>
    </div>

    <canvas ref="canvas_ref" class="map-canvas"></canvas>

    <form class="command-bar" @submit.prevent="submit_command">
      <input
        ref="command_ref"
        v-model="command_input"
        type="text"
        placeholder='create --type belt --pos 0,0,0'
        autocomplete="off"
      />
      <button type="submit">Run</button>
    </form>

    <div class="command-log">
      <div
        v-for="(entry, i) in command_log"
        :key="i"
        class="log-line"
        :class="{ error: !entry.ok }"
      >
        {{ entry.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-console {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #16171d;
  color: #f3f4f6;
  font-family: ui-monospace, Consolas, monospace;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #2e303a;
}

.scale-control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.scale-value {
  min-width: 42px;
}

.map-canvas {
  flex: 1;
  width: 100%;
  min-height: 0;
  display: block;
}

.command-bar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #2e303a;
}

.command-bar input {
  flex: 1;
  background: #1f2028;
  border: 1px solid #2e303a;
  color: #f3f4f6;
  padding: 6px 10px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
}

.command-bar button {
  background: #aa3bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  cursor: pointer;
  font-family: inherit;
}

.command-log {
  max-height: 140px;
  overflow-y: auto;
  padding: 4px 12px 8px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
}

.log-line {
  padding: 2px 0;
  color: #9ca3af;
}

.log-line.error {
  color: #ff6b6b;
}
</style>