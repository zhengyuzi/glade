<script setup lang="ts">
import { homepage } from '../../../../package.json'
</script>

<template>
  <div class="h-45px flex items-center justify-between">
    <h1 class="text-gray-500 font-bold text-5xl select-none">
      Glade
    </h1>
    <div class="flex space-x-4 children:(flex cursor-pointer pointer-events-auto text-4xl text-gray-500)">
      <a target="_blank" :href="homepage">
        <GladeButtonGroup>
          <GladeButton>
            <i class="i-mdi-github" />
          </GladeButton>
        </GladeButtonGroup>
      </a>
    </div>
  </div>
</template>
