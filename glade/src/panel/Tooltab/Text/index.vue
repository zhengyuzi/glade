<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { GladeHookEvent, GladeNode } from '@glade-app/core'
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
  const selectedNodes = workspace.value?.selectedNodes || []
  const nodes = selectedNodes.filter(node => node instanceof GladeText)
  workspace.value?.updateNode(nodes, config)
}, 100)

onMounted(() => {
  text?.config(config)
  updateConfig(workspace.value?.selectedNodes || [])
  workspace.value?.on('history:undo', handleHistory)
  workspace.value?.on('history:redo', handleHistory)
})

onUnmounted(() => {
  workspace.value?.off('history:undo', handleHistory)
  workspace.value?.off('history:redo', handleHistory)
})

function handleHistory(e: GladeHookEvent) {
  updateConfig(e.nodes)
}

function updateConfig(nodes: GladeNode[]) {
  const keys = Object.keys(config) as Array<keyof GladePluginTextConfig>

  nodes
    .filter(node => node instanceof GladeText)
    .forEach((node) => {
      const attrs = node.getAttrs()
      keys.forEach(key => attrs[key] && (config[key] = attrs[key] as never))
    })
}

function updateColor(value: string) {
  config.fill = value
  text?.config({ fill: value })
  updateNode({ fill: value })
}

function updateOpacity(value: number[]) {
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
    <div class="space-y-1">
      <span>{{ t('color') }}</span>
      <GladeColorPicker v-model:value="config.fill" :size="32" @update:value="updateColor" />
    </div>
    <div class="space-y-1">
      <span>{{ t('opacity') }} {{ config.opacity * 100 }}</span>
      <GladeSlider
        :min="0.1"
        :max="1"
        :step="0.1"
        :model-value="[config.opacity]"
        @update:model-value="updateOpacity"
      />
    </div>
  </div>
</template>
