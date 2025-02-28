<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { ITool } from '@/types'
import type { Position } from '@vueuse/core'
import { fileToBase64 } from '@/utils'
import { hotkey } from '@/utils/hotkeys'
import { GLADE_CONFIG } from '@/utils/storage'
import { useDraggable, useElementSize, useFileDialog } from '@vueuse/core'

const { enablePlugin, disablePlugin, createImage } = inject<ReturnType<typeof useGlade>>('glade')!

const {
  onChange: onImageChange,
  open: openSelectImage,
  onCancel: onSelectImageCancel,
  reset: resetSelectImage,
} = useFileDialog({
  accept: 'image/*',
  directory: false,
})

const tools: ITool[] = [
  {
    name: 'selection',
    iconName: 'i-mage-mouse-pointer-fill',
    enable: () => enablePlugin('glade-plugin-selection'),
    disable: () => disablePlugin('glade-plugin-selection'),
  },
  {
    name: 'drag',
    iconName: 'i-fa6-solid-hand',
    enable: () => enablePlugin('glade-plugin-drag-pan'),
    disable: () => disablePlugin('glade-plugin-drag-pan'),
  },
  {
    name: 'draw',
    iconName: 'i-solar-pen-bold',
    enable: () => enablePlugin('glade-plugin-brush'),
    disable: () => disablePlugin('glade-plugin-brush'),
  },
  {
    name: 'text',
    iconName: 'i-mingcute-text-2-fill',
    enable: () => enablePlugin('glade-plugin-text'),
    disable: () => disablePlugin('glade-plugin-text'),
  },
  {
    name: 'image',
    iconName: 'i-fa6-solid-image',
    enable: () => openSelectImage(),
    disable: () => {},
  },
]

const draggableEl = useTemplateRef<HTMLElement>('draggableEl')
const handleEl = useTemplateRef<HTMLElement>('handleEl')

const { width: toolbarW, height: toolbarH } = useElementSize(draggableEl, {
  width: 0,
  height: 0,
})

const currentTool = ref(tools[0].name)

const isVertical = computed(() => GLADE_CONFIG.value.toolbar.direction === 'vertical')

const { style } = useDraggable(draggableEl, {
  initialValue: GLADE_CONFIG.value.toolbar,
  handle: handleEl,
  preventDefault: true,
  stopPropagation: true,
  onEnd: onDragEnd,
})

onMounted(() => {
  tools.forEach((tool, index) => hotkey(`${index + 1}`, () => handleSelectTool(tool.name)))
})

onSelectImageCancel(() => resetTool())

onImageChange(async (files) => {
  for (const file of files || []) {
    const base64 = await fileToBase64(file)
    await createImage(base64)
  }
  resetSelectImage()
  resetTool()
})

function onDragEnd(position: Position) {
  position.x = Math.min(window.innerWidth - toolbarW.value, Math.max(0, position.x))
  position.y = Math.min(window.innerHeight - toolbarH.value, Math.max(0, position.y))

  GLADE_CONFIG.value.toolbar.x = position.x
  GLADE_CONFIG.value.toolbar.y = position.y
}

function handleSelectTool(name: string) {
  if (currentTool.value !== name) {
    const lastTool = tools.find(item => item.name === currentTool.value)
    const tool = tools.find(item => item.name === name)

    lastTool?.disable()
    tool?.enable()

    currentTool.value = name
  }
}

function resetTool() {
  handleSelectTool(tools[0].name)
}

function switchDirection() {
  GLADE_CONFIG.value.toolbar.direction = isVertical.value ? 'horizontal' : 'vertical'
}
</script>

<template>
  <div ref="draggableEl" :style="['position: fixed;z-index: 999;touch-action: none;', style]">
    <GladeButtonGroup
      class="bg-gray-200 text-xl p-1.5"
      :class="isVertical ? 'flex-col space-y-1.5' : 'space-x-2'"
    >
      <!-- Draggable handle -->
      <GladeButton ref="handleEl" class="cursor-move">
        <i
          class="i-akar-icons-drag-horizontal-fill"
          :class="isVertical ? '' : 'transform rotate-90'"
        />
      </GladeButton>
      <!-- Tool buttons -->
      <GladeButton
        v-for="tool in tools"
        :key="tool.name"
        class="relative border-2 border-gray-400 bg-gray-300 rounded-md p-1 active:(scale-90)"
        :class="currentTool === tool.name ? '!bg-gray-500 !text-gray-100' : ''"
        @click="() => handleSelectTool(tool.name)"
      >
        <i :class="tool.iconName" />
      </GladeButton>
      <!-- Switch direction -->
      <GladeButton @click="switchDirection">
        <i class="i-f7-camera-rotate-fill" />
      </GladeButton>
    </GladeButtonGroup>
  </div>
</template>
