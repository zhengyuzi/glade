<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { ISelect } from '@/types'
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

const brushTypes: ISelect[] = [
  {
    label: t('default'),
    value: 'default',
  },
]

const updateNode = useDebounceFn((config: Record<string, any>) => {
  const selectedNodes = workspace.value?.getFlattenedNodes(workspace.value?.selectedNodes || []) || []
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

function updateConfig(_nodes: GladeNode[]) {
  const nodes = workspace.value?.getFlattenedNodes(_nodes) || []

  const keys = Object.keys(config) as Array<keyof GladePluginBrushConfig>
  const lines = nodes.filter(node => node instanceof GladeLine)

  lines.forEach((node) => {
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
  <div class="text-gray-600 space-y-3 select-none">
    <h6 class="text-sm font-bold">
      {{ t('brush') }}
    </h6>
    <div class="h-9 flex space-x-2 items-center py-1 text-sm">
      <GladeSelect
        :value="config.brushType"
        :options="brushTypes"
        :title="t('brush_type')"
        :placeholder="t('brush_type')"
        @update:value="updateBrushType"
      />
    </div>
    <GladeColorPicker :value="config.stroke" :size="32" @update:value="updateColor">
      <div class="h-9 flex space-x-2 items-center border px-2 py-1 rounded bg-gray-50">
        <div class="rounded w-5 h-5 border" :style="`background-color: ${config.stroke}`" />
        <span class="w-17 text-left text-sm">{{ config.stroke }}</span>
      </div>
    </GladeColorPicker>
    <div class="h-9 flex space-x-2 items-center border px-2 py-1 rounded bg-gray-50 text-sm">
      <span>{{ t('stroke_width') }}</span>
      <GladeSlider
        :min="2"
        :max="30"
        :value="[config.strokeWidth]"
        @update:value="updateWidth"
      />
    </div>
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
