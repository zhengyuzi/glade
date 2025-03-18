<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

interface IProps {
  max?: number
  min?: number
  step?: number
  value: number[]
}

withDefaults(defineProps<IProps>(), {
  max: 100,
  min: 0,
  step: 1,
  value: () => [],
})

const emit = defineEmits(['update:value'])

function updateValue(value?: number[]) {
  emit('update:value', value || [])
}
</script>

<template>
  <SliderRoot
    class="flex-1 relative flex items-center select-none touch-none"
    :max="max"
    :min="min"
    :step="step"
    :model-value="value"
    @update:model-value="updateValue"
  >
    <SliderTrack class="bg-gray-200 relative grow rounded-full h-2">
      <SliderRange class="absolute bg-gray-400 rounded-full h-full" />
    </SliderTrack>
    <SliderThumb
      class="block w-4 h-4 bg-white border-3 border-gray-500 rounded-full shadow-md cursor-pointer focus:outline-none"
      aria-label="Volume"
    />
  </SliderRoot>
</template>
