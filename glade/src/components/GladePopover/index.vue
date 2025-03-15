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
}

withDefaults(defineProps<IProps>(), {
  side: 'right',
})
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger class="inline-flex bg-transparent focus:outline-none">
      <slot />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="z-1000 min-w-250px rounded-lg p-5 bg-white shadow-[0px_10px_35px_0px_rgba(22,_23,_24,_0.1),_0px_10px_10px_-10px_rgba(22,_23,_24,_0.1)]"
        :side-offset="25"
        :side="side"
      >
        <PopoverArrow :width="12" :height="8" class="fill-white stroke-gray-100" />
        <slot name="content" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
