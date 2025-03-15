<script setup lang="ts">
import PickColors from 'vue-pick-colors'

interface IProps {
  value?: string
  presets?: string[]
  size?: number
}

withDefaults(defineProps<IProps>(), {
  value: '#000000',
  presets: () => ['#000000', '#FF4500', '#1F93FF', '#00C200', '#FF8C00'],
  size: 30,
})

const emit = defineEmits(['update:value'])

function selectPresetColor(_color: string) {
  emit('update:value', _color)
}

function selectColor(value: string) {
  emit('update:value', value)
}
</script>

<template>
  <div class="flex items-center space-x-2">
    <div
      v-for="item in presets"
      :key="item"
      class="rounded-1/2 border-3 cursor-pointer active:(scale-90)"
      :style="[`width: ${size}px`, `height: ${size}px`, `background-color: ${item}`]"
      @click="() => selectPresetColor(item)"
    />
    <span class="text-gray-400">|</span>
    <PickColors
      :value="value"
      :size="size - 4"
      class="cursor-pointer children:(box-content !rounded-1/2 overflow-hidden)"
      @change="selectColor"
    />
  </div>
</template>
