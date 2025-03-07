<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
</script>

<template>
  <SliderRoot
    class="relative flex items-center select-none touch-none w-full h-8"
    :max="100"
    :step="1"
  >
    <SliderTrack class="bg-gray-200 relative grow rounded-full h-2.5">
      <SliderRange class="absolute bg-gray-400 rounded-full h-full" />
    </SliderTrack>
    <SliderThumb
      class="block w-6 h-6 bg-white border-4 border-gray-500 rounded-full shadow-md cursor-pointer"
      aria-label="Volume"
    />
  </SliderRoot>
</template>
