<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { GladeNode } from '@glade-app/core'
import { GladeGroup } from '@glade-app/core'
import { promiseTimeout } from '@vueuse/core'
import BrushTab from './Brush/index.vue'
import TextTab from './Text/index.vue'

const tabs = {
  brush: BrushTab,
  text: TextTab,
}

const classNames = {
  GladeLine: 'brush',
  GladeText: 'text',
}

const { workspace } = inject<ReturnType<typeof useGlade>>('glade')!

const showTabTools = reactive(new Set<string>([]))

onMounted(() => {
  handleNodeSelect()
  workspace.value?.on('history:change', handleNodeSelect)
  workspace.value?.on('history:undo', handleNodeSelect)
  workspace.value?.on('history:redo', handleNodeSelect)
})

onUnmounted(() => {
  workspace.value?.off('history:change', handleNodeSelect)
  workspace.value?.off('history:undo', handleNodeSelect)
  workspace.value?.off('history:redo', handleNodeSelect)
})

async function handleNodeSelect() {
  await promiseTimeout(0)

  const selectedNodes = workspace.value?.selectedNodes || []

  showTabTools.clear()

  if (!selectedNodes.length) {
    return
  }

  await promiseTimeout(0)

  selectedNodes.forEach(node => addTabType(node))
}

function addTabType(node: GladeNode) {
  if (node instanceof GladeGroup) {
    node.children.forEach(n => addTabType(n))
  }
  else {
    const type = classNames[node.className as keyof typeof classNames]
    type && showTabTools.add(type)
  }
}
</script>

<template>
  <div
    v-if="showTabTools.size"
    class="min-w-280px overflow-hidden rounded-lg bg-white shadow-[0px_10px_35px_0px_rgba(22,_23,_24,_0.1),_0px_10px_10px_-10px_rgba(22,_23,_24,_0.1)] border-2 border-gray-300"
  >
    <div class="max-h-65vh p-4 overflow-auto space-y-4 select-none">
      <span class="text-base font-600 text-gray-600">Settings</span>
      <component :is="tabs[tool as keyof typeof tabs]" v-for="tool in showTabTools" :key="tool" />
    </div>
  </div>
</template>
