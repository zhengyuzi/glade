<script setup lang="ts">
import type { ISelect } from '@/types'
import {
  type AcceptableValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

interface IProps {
  options?: ISelect[]
  value: string
  placeholder?: string
  title?: string
}

withDefaults(defineProps<IProps>(), {
  placeholder: 'Select...',
  value: '',
  options: () => [],
  title: undefined,
})

const emit = defineEmits(['update:value'])

function updateValue(value: AcceptableValue) {
  emit('update:value', value)
}
</script>

<template>
  <SelectRoot :model-value="value" @update:model-value="updateValue">
    <SelectTrigger class="inline-flex w-full items-center justify-between rounded px-[15px] text-xs leading-none h-35px bg-white text-gray-600 hover:bg-gray-50 border data-[placeholder]:text-gray-400 outline-none">
      <SelectValue :placeholder="placeholder" />
      <i class="i-line-md-chevron-small-down text-2xl" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="w-full bg-white rounded border shadow z-100">
        <SelectScrollUpButton class="flex items-center justify-center py-1 bg-white text-gray-500">
          <i class="i-line-md-chevron-small-down text-2xl transform rotate-180" />
        </SelectScrollUpButton>
        <SelectViewport class="p-2">
          <SelectLabel v-if="title" class="text-xs text-gray-500 font-bold p-2">
            {{ title }}
          </SelectLabel>
          <SelectGroup>
            <SelectItem
              v-for="option in options"
              :key="option.value"
              class="text-xs leading-none text-sm text-gray-500 flex items-center p-2 relative select-none cursor-pointer rounded data-[disabled]:pointer-events-none outline-none hover:bg-gray-300"
              :value="option.value"
            >
              <SelectItemIndicator class="absolute left-0 p-1 inline-flex items-center justify-center">
                <i class="i-material-symbols-check-small-rounded" />
              </SelectItemIndicator>
              <SelectItemText>
                {{ option.label }}
              </SelectItemText>
            </SelectItem>
          </SelectGroup>
        </SelectViewport>
        <SelectScrollDownButton class="flex items-center justify-center py-1 bg-white text-gray-500">
          <i class="i-line-md-chevron-small-down text-2xl" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
