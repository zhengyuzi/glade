<script setup lang="ts">
import PickColors from 'vue-pick-colors'

interface IProps {
  presets?: string[]
  size?: number
}

const props = withDefaults(defineProps<IProps>(), {
  presets: () => ['#000000', '#FF4500', '#1F93FF', '#00C200', '#FF8C00'],
  size: 30,
})

const emit = defineEmits(['change'])

const color = ref(props.presets[0])

function selectPresetColor(_color: string) {
  color.value = _color
  emit('change', _color)
}

function selectColor(value: string) {
  emit('change', value)
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
      v-model:value="color"
      :size="size - 4"
      class="cursor-pointer children:(box-content !rounded-1/2 overflow-hidden)"
      @change="selectColor"
    />
  </div>
</template>
