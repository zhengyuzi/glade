<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import { hotkey } from '@/utils/hotkeys'

const { undo, redo, isRedoable, isUndoable } = inject<ReturnType<typeof useGlade>>('glade')!

onMounted(() => {
  hotkey('ctrl+z', () => undo())
  hotkey('ctrl+y', () => redo())
})
</script>

<template>
  <GladeButtonGroup class="h-40px select-none pointer-events-auto">
    <GladeButton class="px-4" :disabled="!isUndoable" @click="undo">
      <i className="i-mingcute-back-fill" />
    </GladeButton>
    <GladeButton class="px-4" :disabled="!isRedoable" @click="redo">
      <i className="i-mingcute-forward-fill" />
    </GladeButton>
  </GladeButtonGroup>
</template>
