<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import { hotkey, unhotkey } from '@/utils/hotkeys'
import { GLADE_CONFIG } from '@/utils/storage'
import Decimal from 'decimal.js'

const { workspace } = inject<ReturnType<typeof useGlade>>('glade')!

const config = {
  step: 0.1,
  min: 0.1,
  max: 10,
}

const zoom = ref(Number(new Decimal(GLADE_CONFIG.value.view.zoom).mul(100)))

const canZoomOut = computed(() => zoom.value > config.min * 100)
const canZoomIn = computed(() => zoom.value < config.max * 100)

onMounted(() => {
  hotkey('ctrl-+', () => zoomIn(), { splitKey: '-' })
  hotkey('ctrl+=', () => zoomIn())
  hotkey('ctrl+-', () => zoomOut())
  hotkey('ctrl+0', () => reset())
})

onUnmounted(() => {
  unhotkey('ctrl-+')
  unhotkey('ctrl+=')
  unhotkey('ctrl+-')
  unhotkey('ctrl+0')
})

function handleSetZoom(value: number) {
  if (zoom.value / 100 === value || value < config.min || value > config.max) {
    return
  }

  workspace.value && (workspace.value.zoom = value)
  zoom.value = Number(new Decimal(value).mul(100))
}

function zoomOut() {
  const value = Number(new Decimal(zoom.value).dividedBy(100).plus(-config.step))
  handleSetZoom(value)
}

function zoomIn() {
  const value = Number(new Decimal(zoom.value).dividedBy(100).plus(config.step))
  handleSetZoom(value)
}

function reset() {
  handleSetZoom(1)
}
</script>

<template>
  <GladeButtonGroup>
    <GladeButton class="px-5" :disabled="!canZoomOut" @click="zoomOut">
      <i className="i-material-symbols-remove-rounded" />
    </GladeButton>
    <GladeButton class="w-50px text-sm" @click="reset">
      {{ zoom }}%
    </GladeButton>
    <GladeButton class="px-5" :disabled="!canZoomIn" @click="zoomIn">
      <i class="i-material-symbols-add-2-rounded" />
    </GladeButton>
  </GladeButtonGroup>
</template>
