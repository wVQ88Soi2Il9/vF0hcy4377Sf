<script setup lang="ts">
import { reactive } from 'vue'
import type { game_map } from '@/core/types'
import { create_pack_registry, load_pack } from '@/core/pack_manager'
import { load_all_packs } from '@/packs/loader'
import MapConsole from '@/packs/vanilla/ui/MapConsole.vue'

const registry = create_pack_registry()
load_all_packs().forEach(p => load_pack(registry, p))

const map: game_map = reactive({
    size: { x: 32, y: 32, z: 1 },
    next_unique_id: 1,
    devices: []
})
</script>

<template>
  <MapConsole :map="map" :registry="registry" />
</template>

<style scoped>
</style>