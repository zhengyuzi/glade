<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { GladeBrushType, GladePluginBrushConfig } from '@glade-app/plugins'
import { type GladeHookEvent, GladeLine, type GladeNode } from '@glade-app/core'
import { useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { getPlugin, workspace } = inject<ReturnType<typeof useGlade>>('glade')!

const brush = getPlugin('glade-plugin-brush')

const config = reactive<Required<GladePluginBrushConfig>>({
  stroke: '#000000',
  opacity: 1,
  strokeWidth: 8,
  brushType: 'default',
})

const brushTypes: { value: GladeBrushType, content: string }[] = [
  {
    value: 'default',
    content: 'Default',
  },
]

const updateNode = useDebounceFn((config: Record<string, any>) => {
  const selectedNodes = workspace.value?.selectedNodes || []
  const nodes = selectedNodes.filter(node => node instanceof GladeLine)
  workspace.value?.updateNode(nodes, config)
}, 100)

onMounted(() => {
  brush?.config(config)
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
  const keys = Object.keys(config) as Array<keyof GladePluginBrushConfig>

  nodes
    .filter(node => node instanceof GladeLine)
    .forEach((node) => {
      const attrs = node.getAttrs()
      keys.forEach(key => attrs[key] && (config[key] = attrs[key] as never))
    })
}

function updateWidth(value: number[]) {
  config.strokeWidth = value[0]
  brush?.config({ strokeWidth: value[0] })
  updateNode({ strokeWidth: value[0] })
}

function updateOpacity(value: number[]) {
  config.opacity = value[0]
  brush?.config({ opacity: value[0] })
  updateNode({ opacity: value[0] })
}

function updateColor(value: string) {
  config.stroke = value
  brush?.config({ stroke: value })
  updateNode({ stroke: value })
}

function updateBrushType(type: GladeBrushType) {
  config.brushType = type
  brush?.config({ brushType: type })
  updateNode({ brushType: type })
}
</script>

<template>
  <div class="text-xs text-gray-600 space-y-3 select-none">
    <h6 class="text-sm font-bold">
      {{ t('brush') }}
    </h6>
    <div class="space-y-1">
      <span>{{ t('color') }}</span>
      <GladeColorPicker v-model:value="config.stroke" :size="32" @update:value="updateColor" />
    </div>
    <div class="space-y-1">
      <span>{{ t('brush_type') }}</span>
      <div class="flex items-center space-x-2 py-1">
        <button
          v-for="item in brushTypes"
          :key="item.value"
          class="p-2 rounded focus:outline-none active:(scale-90)"
          :class="config.brushType === item.value ? 'bg-gray-400 text-gray-50' : 'bg-gray-100'"
          @click="() => updateBrushType(item.value)"
        >
          {{ item.content }}
        </button>
      </div>
    </div>
    <div class="space-y-1">
      <span>{{ t('stroke_width') }} {{ config.strokeWidth }}</span>
      <GladeSlider
        :min="2"
        :max="30"
        :model-value="[config.strokeWidth]"
        @update:model-value="updateWidth"
      />
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
