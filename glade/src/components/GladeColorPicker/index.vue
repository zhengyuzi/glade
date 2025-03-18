<script setup lang="ts">
import { Vue3ColorPicker as ColorPicker } from '@cyhnkckali/vue3-color-picker'
import '@cyhnkckali/vue3-color-picker/dist/style.css'

interface IProps {
  value?: string
  size?: number
}

withDefaults(defineProps<IProps>(), {
  value: '#000000',
  size: 30,
})

const emit = defineEmits(['update:value'])

function selectColor(value: string) {
  emit('update:value', value)
}
</script>

<template>
  <GladePopover side="bottom" :side-offset="0">
    <slot />
    <template #content>
      <ColorPicker
        class="!shadow-none"
        :model-value="value"
        mode="solid"
        type="HEX"
        :show-color-list="false"
        :show-eye-drop="false"
        :show-alpha="false"
        :show-input-menu="false"
        :show-picker-mode="false"
        @update:model-value="selectColor"
      />
    </template>
  </GladePopover>
</template>
