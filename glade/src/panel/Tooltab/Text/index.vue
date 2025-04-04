<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { GladePluginTextConfig } from '@glade-app/plugins'
import { GladeText } from '@glade-app/core'
import { useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { getPlugin, workspace } = inject<ReturnType<typeof useGlade>>('glade')!

const text = getPlugin('glade-plugin-text')

const config = reactive<Required<GladePluginTextConfig>>({
  fill: '#000000',
  opacity: 1,
  fontSize: 30,
  fontFamily: 'Arial, sans-serif',
})

const updateNode = useDebounceFn((config: Record<string, any>) => {
  const selectedNodes = workspace.value?.getFlattenedNodes(workspace.value.selectedNodes) || []
  const nodes = selectedNodes.filter(node => node instanceof GladeText)
  workspace.value?.updateNode(nodes, config)
}, 100)

onMounted(() => {
  text?.config(config)
  updateConfig()
  workspace.value?.on('node:select', updateConfig)
  workspace.value?.on('node:cancel-select', updateConfig)
  workspace.value?.on('history:undo', updateConfig)
  workspace.value?.on('history:redo', updateConfig)
})

onUnmounted(() => {
  workspace.value?.off('node:select', updateConfig)
  workspace.value?.off('node:cancel-select', updateConfig)
  workspace.value?.off('history:undo', updateConfig)
  workspace.value?.off('history:redo', updateConfig)
})

function updateConfig() {
  const nodes = workspace.value?.getFlattenedNodes(workspace.value.selectedNodes) || []

  if (!nodes.length) {
    return
  }

  const keys = Object.keys(config) as Array<keyof GladePluginTextConfig>
  const texts = nodes.filter(node => node instanceof GladeText)

  texts.forEach((node) => {
    const attrs = node.getAttrs()
    keys.forEach(key => attrs[key] && (config[key] = attrs[key] as never))
  })
}

function updateColor(value: string) {
  if (config.fill === value) {
    return
  }

  config.fill = value
  text?.config({ fill: value })
  updateNode({ fill: value })
}

function updateOpacity(value: number[]) {
  if (config.opacity === value[0]) {
    return
  }

  config.opacity = value[0]
  text?.config({ opacity: value[0] })
  updateNode({ opacity: value[0] })
}
</script>

<template>
  <div class="text-xs text-gray-600 space-y-3 select-none">
    <h6 class="text-sm font-bold">
      {{ t('text') }}
    </h6>
    <GladeColorPicker :value="config.fill" :size="32" @update:value="updateColor">
      <div class="h-9 flex space-x-2 items-center border px-2 py-1 rounded bg-gray-50">
        <div class="rounded w-5 h-5 border" :style="`background-color: ${config.fill}`" />
        <span class="w-17 text-left text-sm">{{ config.fill }}</span>
      </div>
    </GladeColorPicker>
    <div class="h-9 flex space-x-2 items-center border px-2 py-1 rounded bg-gray-50 text-sm">
      <span>{{ t('opacity') }}</span>
      <GladeSlider
        :min="0.1"
        :max="1"
        :step="0.1"
        :value="[config.opacity]"
        @update:value="updateOpacity"
      />
    </div>
  </div>
</template>
