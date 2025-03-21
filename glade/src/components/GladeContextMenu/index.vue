<script setup lang="ts">
import type { IContextMenu } from '@/types'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from 'reka-ui'

interface IProps {
  options: IContextMenu[]
}

withDefaults(defineProps<IProps>(), {
  options: () => [],
})
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="z-1000 min-w-[220px] py-2 bg-gray-100 border-2 border-gray-300 outline-none rounded-md shadow-[0px_10px_35px_0px_rgba(22,_23,_24,_0.1),_0px_10px_10px_-10px_rgba(22,_23,_24,_0.1)]">
        <template v-for="(item, index) in options">
          <template v-if="!item.show || item.show()">
            <ContextMenuItem
              v-if="item.type === 'item'"
              :key="item.text"
              class="px-5 py-2 text-sm text-gray-700 flex items-center leading-none select-none outline-none cursor-pointer data-[highlighted]:(bg-gray-300)"
              :style="item.style"
              @click="() => item.fn()"
            >
              {{ item.text }}
              <div class="ml-auto pl-[20px] text-xs text-gray-500">
                {{ item.hotkey }}
              </div>
            </ContextMenuItem>
            <ContextMenuSeparator
              v-else-if="item.type === 'separator'"
              :key="index"
              class="h-[1px] bg-gray-300 my-2"
            />
          </template>
        </template>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
