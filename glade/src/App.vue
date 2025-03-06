<script setup lang="ts">
import useGlade from './hooks/useGlade'
import ContextMenu from './panel/ContextMenu/index.vue'

const Panel = defineAsyncComponent(() => import('./panel/index.vue'))

const stageEl = useTemplateRef<HTMLDivElement>('stageEl')

const glade = useGlade(stageEl)

provide('glade', glade)
</script>

<template>
  <div class="w-screen h-screen overflow-hidden relative">
    <ContextMenu>
      <div ref="stageEl" class="w-full h-full" />
    </ContextMenu>
    <Panel />
  </div>
</template>
