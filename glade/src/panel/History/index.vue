<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import { hotkey } from '@/utils/hotkeys'

const { undo, redo, isRedo, isUndo } = inject<ReturnType<typeof useGlade>>('glade')!

onMounted(() => {
  hotkey('ctrl+z', () => undo())
  hotkey('ctrl+y', () => redo())
})
</script>

<template>
  <GladeButtonGroup class="select-none pointer-events-auto">
    <GladeButton class="px-4" :disabled="!isUndo" @click="undo">
      <i className="i-mingcute-back-fill" />
    </GladeButton>
    <GladeButton class="px-4" :disabled="!isRedo" @click="redo">
      <i className="i-mingcute-forward-fill" />
    </GladeButton>
  </GladeButtonGroup>
</template>
