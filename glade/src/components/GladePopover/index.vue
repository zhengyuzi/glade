<script setup lang="ts">
import {
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'

interface IProps {
  side?: 'right' | 'bottom' | 'left' | 'top'
  sideOffset?: number
}

withDefaults(defineProps<IProps>(), {
  side: 'right',
  sideOffset: 20,
})
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger class="inline-flex bg-transparent focus:outline-none">
      <slot />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="!pointer-events-auto relative z-9 min-w-250px rounded-lg bg-white shadow-[0px_10px_35px_0px_rgba(22,_23,_24,_0.1),_0px_10px_10px_-10px_rgba(22,_23,_24,_0.1)] border-2 border-gray-300 focus:outline-none"
        :side-offset="sideOffset"
        :side="side"
      >
        <PopoverArrow
          :width="12"
          :height="8"
          class="fill-white stroke-2 stroke-gray-300"
        />
        <slot name="content" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
