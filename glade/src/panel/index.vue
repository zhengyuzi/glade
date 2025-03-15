<script setup lang="ts">
import Header from './Header/index.vue'
import History from './History/index.vue'
import Toolbar from './Toolbar/index.vue'
import ToolTab from './Tooltab/index.vue'
import Zoom from './Zoom/index.vue'
</script>

<template>
  <div class="glade-control-panel pointer-events-none">
    <Header class="absolute z-1 top-6 left-6 right-6" />
    <Toolbar class="pointer-events-auto" />
    <ToolTab class="pointer-events-auto absolute z-1 top-30 right-6" />
    <div class="absolute z-1 right-6 bottom-6 flex items-center space-x-4 children:(h-12)">
      <History class="pointer-events-auto" />
      <Zoom class="pointer-events-auto" />
    </div>
  </div>
</template>
