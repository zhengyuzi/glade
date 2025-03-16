<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

interface IProps {
  max?: number
  min?: number
  step?: number
}

withDefaults(defineProps<IProps>(), {
  max: 100,
  min: 0,
  step: 1,
})
</script>

<template>
  <SliderRoot
    class="relative flex items-center select-none touch-none w-full h-6"
    :max="max"
    :min="min"
    :step="step"
  >
    <SliderTrack class="bg-gray-200 relative grow rounded-full h-2">
      <SliderRange class="absolute bg-gray-400 rounded-full h-full" />
    </SliderTrack>
    <SliderThumb
      class="block w-5 h-5 bg-white border-4 border-gray-500 rounded-full shadow-md cursor-pointer focus:outline-none"
      aria-label="Volume"
    />
  </SliderRoot>
</template>
