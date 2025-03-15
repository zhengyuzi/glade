<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import { hotkey, unhotkey } from '@/utils/hotkeys'

const { workspace, history } = inject<ReturnType<typeof useGlade>>('glade')!

const canUndo = ref(false)
const canRedo = ref(false)

onMounted(() => {
  workspace.value?.on('history:change', handleHistoryChange)
  workspace.value?.on('history:undo', handleHistoryChange)
  workspace.value?.on('history:redo', handleHistoryChange)
  hotkey('ctrl+z', () => undo())
  hotkey('ctrl+y', () => redo())
})

onUnmounted(() => {
  workspace.value?.off('history:change', handleHistoryChange)
  workspace.value?.off('history:undo', handleHistoryChange)
  workspace.value?.off('history:redo', handleHistoryChange)
  unhotkey('ctrl+z')
  unhotkey('ctrl+y')
})

function handleHistoryChange() {
  canUndo.value = history.value?.isUndo || false
  canRedo.value = history.value?.isRedo || false
}

function undo() {
  history.value?.undo()
}

function redo() {
  history.value?.redo()
}
</script>

<template>
  <GladeButtonGroup class="select-none pointer-events-auto">
    <GladeButton class="px-5" :disabled="!canUndo" @click="undo">
      <i className="i-mingcute-back-fill" />
    </GladeButton>
    <GladeButton class="px-5" :disabled="!canRedo" @click="redo">
      <i className="i-mingcute-forward-fill" />
    </GladeButton>
  </GladeButtonGroup>
</template>
