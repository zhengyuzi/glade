<script setup lang="ts">
import type { IToggleGroup } from '@/types'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'

interface IProps {
  options: IToggleGroup[]
  ariaLabel: string
}

withDefaults(defineProps<IProps>(), {
  options: () => [],
  ariaLabel: undefined,
})
</script>

<template>
  <ToggleGroupRoot class="space-x-2 py-1">
    <ToggleGroupItem
      v-for="item in options"
      :key="item.value"
      :value="item.value"
      :aria-label="ariaLabel"
      class="p-2 rounded bg-gray-200 data-[state=on]:(bg-gray-400 text-white)"
    >
      <component :is="item.content" />
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
