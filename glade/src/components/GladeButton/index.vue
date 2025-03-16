<script setup lang="ts">
interface IProps {
  disabled?: boolean
}

withDefaults(defineProps<IProps>(), {
  disabled: false,
})
</script>

<template>
  <button
    :disabled="disabled"
    class="inline-flex items-center justify-center bg-gray-200 text-gray-500 focus:outline-none"
    :class="disabled ? 'text-opacity-30 pointer-events-none' : 'hover:(text-gray-700)'"
  >
    <slot />
  </button>
</template>
